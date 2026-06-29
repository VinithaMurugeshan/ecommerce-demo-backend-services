import { Coupon, Prisma } from "@prisma/client";

type Decimalish = Prisma.Decimal | number | string;

function toNumber(value: Decimalish): number {
  return typeof value === "number" ? value : Number(value);
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface PricingLineItem {
  unitPrice: Decimalish;
  quantity: number;
}

export interface PricingResult {
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
  itemCount: number;
}

// Simple, configurable business rules for the demo.
const FREE_SHIPPING_THRESHOLD = 75;
const FLAT_SHIPPING_FEE = 7.99;
const TAX_RATE = 0.08; // 8%

export function computeDiscount(subtotal: number, coupon: Coupon | null): number {
  if (!coupon || !coupon.isActive) return 0;
  if (coupon.minOrderValue && subtotal < toNumber(coupon.minOrderValue)) return 0;

  let discount = 0;
  if (coupon.discountType === "PERCENTAGE") {
    discount = subtotal * (toNumber(coupon.discountValue) / 100);
  } else {
    discount = toNumber(coupon.discountValue);
  }
  if (coupon.maxDiscount) {
    discount = Math.min(discount, toNumber(coupon.maxDiscount));
  }
  return round2(Math.min(discount, subtotal));
}

export function calculatePricing(
  items: PricingLineItem[],
  coupon: Coupon | null = null
): PricingResult {
  const subtotal = round2(
    items.reduce((sum, i) => sum + toNumber(i.unitPrice) * i.quantity, 0)
  );
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const discountTotal = computeDiscount(subtotal, coupon);
  const taxable = Math.max(0, subtotal - discountTotal);
  const shippingTotal =
    subtotal === 0 || taxable >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
  const taxTotal = round2(taxable * TAX_RATE);
  const grandTotal = round2(taxable + shippingTotal + taxTotal);

  return {
    subtotal,
    discountTotal,
    shippingTotal,
    taxTotal,
    grandTotal,
    itemCount,
  };
}
