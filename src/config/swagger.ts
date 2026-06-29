import swaggerJsdoc from "swagger-jsdoc";
import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import path from "path";
import { env } from "./env";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "E-Commerce API",
      version: "1.0.0",
      description:
        "REST API for the E-Commerce platform: auth & accounts, catalog, cart, " +
        "wishlist, coupons, checkout/orders, Stripe payments, order tracking and returns/refunds.",
    },
    servers: [{ url: env.apiPrefix, description: "API base path" }],
    tags: [
      { name: "Auth", description: "Registration, login, tokens, password reset" },
      { name: "Account", description: "Profile, addresses and settings" },
      { name: "Categories", description: "Product categories" },
      { name: "Products", description: "Browse, search, filter and product detail" },
      { name: "Reviews", description: "Product reviews & ratings" },
      { name: "Cart", description: "Shopping cart and coupon application" },
      { name: "Wishlist", description: "Saved items and move-to-cart" },
      { name: "Coupons", description: "Promo code validation" },
      { name: "Orders", description: "Checkout, orders and tracking" },
      { name: "Payments", description: "Stripe payments and webhooks" },
      { name: "Returns", description: "Returns and refunds" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: {
              type: "object",
              properties: {
                message: { type: "string" },
                details: { type: "object", nullable: true },
              },
            },
          },
        },
        PaginationMeta: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 20 },
            total: { type: "integer", example: 135 },
            totalPages: { type: "integer", example: 7 },
          },
        },
        AuthTokens: {
          type: "object",
          properties: {
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            phone: { type: "string", nullable: true },
            role: { type: "string", enum: ["CUSTOMER", "ADMIN"] },
            emailNotifications: { type: "boolean" },
            smsNotifications: { type: "boolean" },
          },
        },
        Address: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            type: { type: "string", enum: ["SHIPPING", "BILLING"] },
            fullName: { type: "string" },
            phone: { type: "string" },
            line1: { type: "string" },
            line2: { type: "string", nullable: true },
            city: { type: "string" },
            state: { type: "string" },
            postalCode: { type: "string" },
            country: { type: "string" },
            isDefault: { type: "boolean" },
          },
        },
        Category: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            slug: { type: "string" },
            description: { type: "string", nullable: true },
            imageUrl: { type: "string", nullable: true },
            parentId: { type: "string", nullable: true },
          },
        },
        Product: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            slug: { type: "string" },
            description: { type: "string" },
            brand: { type: "string", nullable: true },
            sku: { type: "string" },
            price: { type: "number", format: "float" },
            compareAtPrice: { type: "number", format: "float", nullable: true },
            currency: { type: "string" },
            stock: { type: "integer" },
            isFeatured: { type: "boolean" },
            ratingAverage: { type: "number" },
            ratingCount: { type: "integer" },
            categoryId: { type: "string" },
            images: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  url: { type: "string" },
                  alt: { type: "string", nullable: true },
                  position: { type: "integer" },
                },
              },
            },
          },
        },
        Review: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            rating: { type: "integer", minimum: 1, maximum: 5 },
            title: { type: "string", nullable: true },
            comment: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        CartItem: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            productId: { type: "string" },
            quantity: { type: "integer" },
            product: { $ref: "#/components/schemas/Product" },
          },
        },
        Cart: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/CartItem" },
            },
            coupon: { $ref: "#/components/schemas/Coupon", nullable: true },
            summary: {
              type: "object",
              properties: {
                subtotal: { type: "number" },
                discountTotal: { type: "number" },
                shippingTotal: { type: "number" },
                taxTotal: { type: "number" },
                grandTotal: { type: "number" },
                itemCount: { type: "integer" },
              },
            },
          },
        },
        Coupon: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            code: { type: "string" },
            description: { type: "string", nullable: true },
            discountType: { type: "string", enum: ["PERCENTAGE", "FIXED"] },
            discountValue: { type: "number" },
            minOrderValue: { type: "number", nullable: true },
            maxDiscount: { type: "number", nullable: true },
          },
        },
        Order: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            orderNumber: { type: "string" },
            status: {
              type: "string",
              enum: [
                "PENDING",
                "CONFIRMED",
                "PACKED",
                "SHIPPED",
                "OUT_FOR_DELIVERY",
                "DELIVERED",
                "CANCELLED",
              ],
            },
            subtotal: { type: "number" },
            discountTotal: { type: "number" },
            shippingTotal: { type: "number" },
            taxTotal: { type: "number" },
            grandTotal: { type: "number" },
            currency: { type: "string" },
            items: { type: "array", items: { type: "object" } },
            payment: { $ref: "#/components/schemas/Payment" },
            placedAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Payment: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            method: {
              type: "string",
              enum: ["CARD", "UPI", "NET_BANKING", "WALLET", "COD"],
            },
            status: {
              type: "string",
              enum: [
                "PENDING",
                "PROCESSING",
                "PAID",
                "FAILED",
                "REFUNDED",
                "PARTIALLY_REFUNDED",
              ],
            },
            amount: { type: "number" },
            currency: { type: "string" },
            stripeClientSecret: { type: "string", nullable: true },
          },
        },
        ReturnRequest: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            orderId: { type: "string" },
            status: {
              type: "string",
              enum: ["REQUESTED", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED"],
            },
            reason: { type: "string" },
            comment: { type: "string", nullable: true },
            refundAmount: { type: "number", nullable: true },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Scan compiled JS in prod and TS in dev for JSDoc @openapi blocks.
  apis: [
    path.join(__dirname, "../modules/**/*.routes.{ts,js}"),
    path.join(__dirname, "../routes/*.{ts,js}"),
    path.join(__dirname, "../app.{ts,js}"),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

export function mountSwagger(app: Express): void {
  app.get("/docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customSiteTitle: "E-Commerce API Docs",
    })
  );
}
