import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { stripe, isStripeEnabled } from "../../config/stripe";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";

function toCents(amount: Prisma.Decimal | number): number {
  return Math.round(Number(amount) * 100);
}

/** Marks an order's payment as paid and advances the order to CONFIRMED. */
async function markOrderPaid(orderId: string, chargeId?: string) {
  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment || payment.status === "PAID") return;

  await prisma.$transaction([
    prisma.payment.update({
      where: { orderId },
      data: { status: "PAID", stripeChargeId: chargeId },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CONFIRMED",
        placedAt: new Date(),
        tracking: {
          create: { status: "CONFIRMED", message: "Payment received, order confirmed" },
        },
      },
    }),
  ]);
}

async function markOrderFailed(orderId: string) {
  await prisma.payment.update({
    where: { orderId },
    data: { status: "FAILED" },
  });
}

export const paymentsService = {
  /** The available payment methods shown on the payment screen. */
  getMethods() {
    return [
      { code: "CARD", label: "Credit / Debit Card", gateway: "stripe", enabled: true },
      { code: "UPI", label: "UPI", gateway: "stripe", enabled: isStripeEnabled },
      { code: "NET_BANKING", label: "Net Banking", gateway: "stripe", enabled: isStripeEnabled },
      { code: "WALLET", label: "Wallet", gateway: "stripe", enabled: isStripeEnabled },
      { code: "COD", label: "Cash on Delivery", gateway: "none", enabled: true },
    ];
  },

  /**
   * Creates a Stripe PaymentIntent for an order and returns the client secret
   * for the frontend to confirm the payment with Stripe.js.
   */
  async createPaymentIntent(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { payment: true },
    });
    if (!order) throw ApiError.notFound("Order not found");
    if (!order.payment) throw ApiError.badRequest("Order has no payment record");
    if (order.payment.status === "PAID") {
      throw ApiError.badRequest("Order is already paid");
    }
    if (order.payment.method === "COD") {
      throw ApiError.badRequest("Cash on delivery does not require a payment intent");
    }

    // Mock mode: no real Stripe key configured.
    if (!isStripeEnabled || !stripe) {
      const fakeId = `pi_mock_${order.id}`;
      const clientSecret = `${fakeId}_secret_mock`;
      await prisma.payment.update({
        where: { orderId },
        data: {
          status: "PROCESSING",
          stripePaymentIntentId: fakeId,
          stripeClientSecret: clientSecret,
        },
      });
      return {
        clientSecret,
        paymentIntentId: fakeId,
        amount: Number(order.payment.amount),
        currency: order.payment.currency,
        mock: true,
      };
    }

    const intent = await stripe.paymentIntents.create({
      amount: toCents(order.payment.amount),
      currency: order.currency || env.stripe.currency,
      metadata: { orderId: order.id, orderNumber: order.orderNumber, userId },
      automatic_payment_methods: { enabled: true },
    });

    await prisma.payment.update({
      where: { orderId },
      data: {
        status: "PROCESSING",
        stripePaymentIntentId: intent.id,
        stripeClientSecret: intent.client_secret,
      },
    });

    return {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount: Number(order.payment.amount),
      currency: order.payment.currency,
      mock: false,
    };
  },

  /**
   * Confirms a payment without webhooks. Useful for COD and for mock mode /
   * local testing where Stripe webhooks cannot reach the server.
   */
  async confirmPayment(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { payment: true },
    });
    if (!order || !order.payment) throw ApiError.notFound("Order not found");

    if (order.payment.method === "COD") {
      // COD is confirmed at order time; just confirm the order.
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "CONFIRMED",
          placedAt: new Date(),
          tracking: {
            create: { status: "CONFIRMED", message: "Order confirmed (cash on delivery)" },
          },
        },
      });
      return prisma.payment.findUnique({ where: { orderId } });
    }

    // For real Stripe, verify the intent actually succeeded.
    if (isStripeEnabled && stripe && order.payment.stripePaymentIntentId) {
      const intent = await stripe.paymentIntents.retrieve(
        order.payment.stripePaymentIntentId
      );
      if (intent.status !== "succeeded") {
        throw ApiError.badRequest(`Payment not completed (status: ${intent.status})`);
      }
      await markOrderPaid(orderId, intent.latest_charge as string | undefined);
    } else {
      // Mock mode: trust the confirmation.
      await markOrderPaid(orderId);
    }

    return prisma.payment.findUnique({ where: { orderId } });
  },

  /** Handles Stripe webhook events (called from the raw-body webhook route). */
  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!isStripeEnabled || !stripe) {
      throw ApiError.badRequest("Stripe is not configured");
    }
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        env.stripe.webhookSecret
      );
    } catch (err) {
      throw ApiError.badRequest(
        `Webhook signature verification failed: ${(err as Error).message}`
      );
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata?.orderId;
        if (orderId) {
          await markOrderPaid(orderId, intent.latest_charge as string | undefined);
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const orderId = intent.metadata?.orderId;
        if (orderId) await markOrderFailed(orderId);
        break;
      }
      default:
        break;
    }

    return { received: true };
  },

  /** Issues a refund (admin). Supports full or partial refunds. */
  async refund(orderId: string, amount?: number) {
    const payment = await prisma.payment.findUnique({ where: { orderId } });
    if (!payment) throw ApiError.notFound("Payment not found");
    if (payment.status !== "PAID" && payment.status !== "PARTIALLY_REFUNDED") {
      throw ApiError.badRequest("Only paid orders can be refunded");
    }

    const refundAmount = amount ?? Number(payment.amount) - Number(payment.refundedAmount);
    if (refundAmount <= 0) throw ApiError.badRequest("Nothing left to refund");

    if (isStripeEnabled && stripe && payment.stripePaymentIntentId) {
      await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        amount: toCents(refundAmount),
      });
    }

    const newRefunded = Number(payment.refundedAmount) + refundAmount;
    const fullyRefunded = newRefunded >= Number(payment.amount);

    const updated = await prisma.payment.update({
      where: { orderId },
      data: {
        refundedAmount: newRefunded,
        status: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED",
      },
    });
    return updated;
  },
};
