/**
 * Domain enums.
 *
 * SQLite (used in mock / no-DB mode) does not support Prisma `enum` types, so
 * the corresponding columns are stored as strings. These union types + value
 * maps give us the same type-safety and constants throughout the codebase,
 * independent of the database provider.
 */

export type Role = "CUSTOMER" | "ADMIN";
export const Role = { CUSTOMER: "CUSTOMER", ADMIN: "ADMIN" } as const;

export type AddressType = "SHIPPING" | "BILLING";
export const AddressType = { SHIPPING: "SHIPPING", BILLING: "BILLING" } as const;

export type DiscountType = "PERCENTAGE" | "FIXED";
export const DiscountType = { PERCENTAGE: "PERCENTAGE", FIXED: "FIXED" } as const;

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";
export const OrderStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PACKED: "PACKED",
  SHIPPED: "SHIPPED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";
export const PaymentStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
  PARTIALLY_REFUNDED: "PARTIALLY_REFUNDED",
} as const;

export type PaymentMethod = "CARD" | "UPI" | "NET_BANKING" | "WALLET" | "COD";
export const PaymentMethod = {
  CARD: "CARD",
  UPI: "UPI",
  NET_BANKING: "NET_BANKING",
  WALLET: "WALLET",
  COD: "COD",
} as const;

export type ReturnStatus =
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "RECEIVED"
  | "REFUNDED";
export const ReturnStatus = {
  REQUESTED: "REQUESTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  RECEIVED: "RECEIVED",
  REFUNDED: "REFUNDED",
} as const;
