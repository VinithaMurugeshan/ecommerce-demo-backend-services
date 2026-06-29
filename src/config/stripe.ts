import Stripe from "stripe";
import { env } from "./env";

/**
 * Stripe client. When STRIPE_SECRET_KEY is not configured the API runs in
 * "mock" mode so the payment flow remains testable without real keys.
 * The SDK's pinned API version is used by default.
 */
export const stripe = env.stripe.enabled
  ? new Stripe(env.stripe.secretKey)
  : null;

export const isStripeEnabled = env.stripe.enabled;
