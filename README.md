# E-Commerce API

A complete REST backend for the e-commerce platform in the project flowchart, built with
**Node.js + Express + TypeScript**, **Prisma**, and **Stripe** payments, with interactive
**Swagger** documentation.

> **Runs instantly with no external database.** The default config uses **SQLite** (a local
> file) and **mock-mode Stripe** (no API keys), so you can clone, install, and run. You can
> switch to PostgreSQL + real Stripe keys at any time (see below).

It covers every flow in the design: authentication & accounts, catalog browsing/search/filtering,
product detail, reviews, cart, wishlist, coupons, checkout, orders, **payment gateway (Stripe)**,
order tracking, and returns/refunds.

## Tech stack

| Concern        | Choice                              |
| -------------- | ----------------------------------- |
| Runtime        | Node.js + Express 4                 |
| Language       | TypeScript                          |
| Database       | SQLite (default) / PostgreSQL       |
| ORM/Migrations | Prisma                              |
| Auth           | JWT (access + rotating refresh)     |
| Validation     | Zod                                 |
| Payments       | Stripe (PaymentIntents + webhooks)  |
| Docs           | Swagger / OpenAPI 3 (swagger-jsdoc) |

## Getting started

### 1. Prerequisites

- Node.js 18+
- That's it — SQLite needs no server. (Docker is only needed for the optional Postgres mode.)

### 2. Install & configure

```bash
npm install
cp .env.example .env        # already defaults to SQLite + mock Stripe
```

A ready-to-use `.env` is also included in the repo.

### 3. Create the database & seed

```bash
npm run prisma:generate
npx prisma db push          # creates prisma/dev.db (SQLite) from the schema
npm run db:seed             # demo users, products, coupon
```

### 4. Run the API

```bash
npm run dev
```

- API base: `http://localhost:4000/api/v1`
- Swagger UI: `http://localhost:4000/docs`
- OpenAPI JSON: `http://localhost:4000/docs.json`

### Switching to PostgreSQL (optional)

1. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
2. Set `DATABASE_URL` in `.env` to your Postgres URL (a ready docker-compose.yml is included: `docker compose up -d`).
3. (Optional) Restore native types — change status/role columns back to `enum`s and add `@db.Decimal(10, 2)` to money fields for stricter typing.
4. Run `npx prisma migrate dev --name init && npm run db:seed`.

### Demo credentials (from seed)

| Role     | Email            | Password       |
| -------- | ---------------- | -------------- |
| Customer | demo@shop.test   | `Password123!` |
| Admin    | admin@shop.test  | `Password123!` |

Coupon code: `WELCOME10` (10% off, min order $30).

## Authentication

1. `POST /auth/register` or `POST /auth/login` → returns `accessToken` + `refreshToken`.
2. Send `Authorization: Bearer <accessToken>` on protected routes.
3. `POST /auth/refresh` with the refresh token to rotate tokens.

In Swagger UI, click **Authorize** and paste the access token.

## Payment gateway (Stripe)

The checkout → payment flow:

1. `POST /orders/checkout` — creates an order from the cart (status `PENDING`) and a pending payment.
2. `POST /payments/{orderId}/intent` — creates a Stripe **PaymentIntent**, returns a `clientSecret`.
3. Frontend confirms the payment with Stripe.js using the `clientSecret`.
4. Stripe calls `POST /api/v1/payments/webhook` → the order moves to `CONFIRMED` and payment to `PAID`.
   - Locally you can instead call `POST /payments/{orderId}/confirm` to confirm without webhooks.
5. Refunds: `POST /payments/{orderId}/refund` (admin), full or partial.

### Mock mode (no Stripe keys)

If `STRIPE_SECRET_KEY` is empty, the API runs in **mock mode**: `/payments/{orderId}/intent`
returns a fake `clientSecret`, and `/payments/{orderId}/confirm` marks the order paid. This lets
you exercise the whole flow without real keys.

### Testing the webhook locally

```bash
stripe listen --forward-to localhost:4000/api/v1/payments/webhook
# put the printed whsec_... into STRIPE_WEBHOOK_SECRET
```

## API overview

| Area      | Key endpoints |
| --------- | ------------- |
| Auth      | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password` |
| Account   | `GET/PATCH /account/profile`, `PATCH /account/settings`, `POST /account/change-password`, `CRUD /account/addresses` |
| Catalog   | `GET /categories`, `GET /products` (search/filter/sort/paginate), `GET /products/{slug}`, `GET /products/{slug}/related`, `GET /products/facets` |
| Reviews   | `GET/POST /products/{slug}/reviews`, `PATCH/DELETE /reviews/{id}` |
| Cart      | `GET /cart`, `POST /cart/items`, `PATCH/DELETE /cart/items/{productId}`, `POST/DELETE /cart/coupon` |
| Wishlist  | `GET /wishlist`, `POST /wishlist/items`, `DELETE /wishlist/items/{productId}`, `POST /wishlist/items/{productId}/move-to-cart` |
| Coupons   | `POST /coupons/validate`, admin CRUD |
| Orders    | `POST /orders/checkout`, `GET /orders`, `GET /orders/{id}`, `GET /orders/track/{orderNumber}`, `POST /orders/{id}/cancel`, admin status updates |
| Payments  | `GET /payments/methods`, `POST /payments/{orderId}/intent`, `POST /payments/{orderId}/confirm`, `POST /payments/{orderId}/refund`, `POST /payments/webhook` |
| Returns   | `GET/POST /returns`, `GET /returns/{id}`, admin status updates |

All responses use a consistent envelope:

```jsonc
// success
{ "success": true, "data": { /* ... */ }, "meta": { /* pagination, optional */ } }
// error
{ "success": false, "error": { "message": "...", "details": [ /* ... */ ] } }
```

## Project structure

```
prisma/
  schema.prisma        # data model
  seed.ts              # demo data
src/
  config/              # env, prisma client, stripe, swagger
  middleware/          # auth, validation, error handling
  utils/               # jwt, password, pricing, http helpers
  modules/             # feature modules (each: routes/controller/service/validation)
    auth/ users/ categories/ products/ reviews/
    cart/ wishlist/ coupons/ orders/ payments/ returns/
  routes/index.ts      # route registry
  app.ts               # express app
  server.ts            # bootstrap
```

## Scripts

| Script                  | Description                       |
| ----------------------- | --------------------------------- |
| `npm run dev`           | Start in watch mode               |
| `npm run build`         | Compile TypeScript to `dist/`     |
| `npm start`             | Run compiled server               |
| `npm run typecheck`     | Type-check without emitting       |
| `npm run prisma:migrate`| Create/apply a dev migration      |
| `npm run db:seed`       | Seed demo data                    |
| `npm run prisma:studio` | Open Prisma Studio                |
