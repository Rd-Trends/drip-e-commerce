# Developer Onboarding

## Overview

Drip is a fashion e-commerce platform built on Next.js 15 and Payload CMS 3. It combines a customer storefront, a Payload admin panel, custom e-commerce flows, Paystack payments, Resend emails, and CMS-driven marketing content.

This guide is for engineers who need to run, support, or extend the project.

## Stack

- Next.js 15 with App Router
- React 19
- TypeScript
- Payload CMS 3
- PostgreSQL via `@payloadcms/db-postgres`
- Tailwind CSS 4 and shadcn/ui
- TanStack Query for client data fetching and mutation workflows
- Paystack for payments
- Resend for transactional email
- S3-compatible object storage for media uploads
- Vitest and Playwright for test coverage

## High-Level Architecture

### Application Layers

- `src/app/(frontend)` contains the customer-facing application
- `src/app/(payload)` contains the Payload admin and API surface
- `src/collections` defines Payload collections such as products, orders, users, carts, coupons, and pages
- `src/globals` defines editable site-wide configuration such as header, footer, home, banner, and shipping settings
- `src/endpoints` contains custom server endpoints for payment, coupons, analytics, cart merge, and webhooks
- `src/plugins` configures Payload plugins such as SEO, forms, and S3 storage

### Core Runtime Patterns

- Payload is the source of truth for product, order, content, and user data.
- The storefront reads from Payload using server components and custom API helpers.
- Cart state is persisted for guests in local storage and synced to the backend by cart ID and secret.
- Checkout creates a transaction first, then confirms the final order after Paystack verification.
- Pages use a block-based content builder for flexible marketing and support content.

## Business Flows You Should Understand First

### Product and Variant Flow

- Products can be simple or variant-enabled.
- Variant types and variant options define allowed combinations.
- Variant records represent real purchasable SKUs with their own inventory.
- Product galleries can map images to specific variant options.

### Cart and Checkout Flow

- Guests can create and use carts without logging in.
- Logged-in users can maintain carts linked to their account.
- Guest carts can be merged after authentication.
- Checkout calculates subtotal, coupon discount, shipping fee, tax, and grand total.
- Payment is initiated through a custom Paystack endpoint.
- Order confirmation re-verifies payment server-side before creating the final order.

### Order and Notification Flow

- Successful confirmation creates an order and links the transaction.
- Inventory is decremented after successful order confirmation.
- Coupon usage is tracked after order creation.
- Order confirmation emails are sent to the customer and staff users with admin or order-manager roles.

## Local Setup

### Prerequisites

- Node.js `18.20.2+` or `20.9.0+`
- `pnpm`
- PostgreSQL
- S3-compatible storage credentials for media uploads
- Paystack credentials if you need to test payments end to end
- Resend credentials if you need real email delivery

### Environment Variables

Copy `.env.example` to `.env` and set values for the following keys.

| Variable                          | Required           | Purpose                                                        |
| --------------------------------- | ------------------ | -------------------------------------------------------------- |
| `DATABASE_URI`                    | Yes                | PostgreSQL connection string used by Payload                   |
| `PAYLOAD_SECRET`                  | Yes                | Payload auth and session secret                                |
| `NEXT_PUBLIC_SERVER_URL`          | Yes                | Public base URL used across frontend and metadata              |
| `PREVIEW_SECRET`                  | Recommended        | Draft preview protection for content previews                  |
| `PAYSTACK_SECRET_KEY`             | For payments       | Server-side Paystack verification and payment initiation       |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Optional currently | Reserved in env template for Paystack public-side integrations |
| `IS_LOCAL`                        | Optional           | Enables creation of demo staff users during seed               |
| `S3_ENDPOINT`                     | Yes for media      | Object storage endpoint                                        |
| `S3_BUCKET`                       | Yes for media      | Object storage bucket                                          |
| `S3_REGION`                       | Yes for media      | Storage region                                                 |
| `S3_ACCESS_KEY_ID`                | Yes for media      | Storage access key                                             |
| `S3_SECRET_ACCESS_KEY`            | Yes for media      | Storage secret                                                 |
| `RESEND_API_KEY`                  | For email          | Sends forgot password and order notification emails            |
| `EMAIL_FROM_NAME`                 | Recommended        | Display name for outgoing emails                               |
| `EMAIL_FROM_ADDRESS`              | Recommended        | Sender address for outgoing emails                             |

### First-Time Boot

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL and create the target database.
3. Run `pnpm install`.
4. Run `pnpm payload migrate` for a fresh database.
5. Run `pnpm dev`.
6. Open `/admin` and create the first admin user, or run `pnpm db:seed` for demo content.

### Seed Data

`pnpm db:seed` clears and recreates demo content. When `IS_LOCAL=true`, it also creates:

- `admin@drip.com` / `admin123`
- `order@drip.com` / `order123`
- `content@drip.com` / `content123`

Use this only in a safe local environment.

## Repository Map

### Key Directories

- `src/collections` - Payload collections and collection hooks
- `src/globals` - site-wide editable CMS globals
- `src/endpoints` - custom Payload endpoints
- `src/components` - shared UI and feature components
- `src/hooks` - data hooks, access helpers, and feature hooks
- `src/providers` - app-level providers for auth, cart, currency, theme, and queries
- `src/lib` - shared utilities, constants, email templates, and API wrappers
- `src/app/(frontend)` - storefront routes
- `src/app/(payload)` - admin routes and Payload integration

### Main Collections

- `users` - auth users and staff roles
- `products` - product definitions, galleries, SEO, and variant configuration
- `variants`, `variantTypes`, `variantOptions` - SKU combinations and stock model
- `categories` - product categorization
- `carts` - guest and customer carts
- `orders` - final order records and fulfillment status
- `transactions` - payment transaction records
- `coupons` - discount rules
- `pages` - block-based marketing and support pages
- `media` - uploaded assets
- `addresses` - saved customer addresses

### Globals

- `header` - navigation items
- `footer` - footer navigation
- `home` - hero slides and homepage product sections
- `banner` - top banner content
- `shipping-config` - state shipping fees, free shipping threshold, and tax rate

## Access Control Model

The codebase uses small reusable access functions in `src/access` instead of embedding permission logic inline.

Important roles:

- `admin` - full access
- `order-manager` - order operations and order analytics
- `content-manager` - product, content, and coupon management
- `customer` - storefront-only account behavior

When adding new collections or fields, reuse the atomic access helpers where possible instead of creating one-off role checks inside collection configs.

## CMS and Content Model Notes

- `pages` uses reusable blocks for content, FAQ, CTA, and forms.
- `products` uses SEO plugin fields and live preview support.
- `users` customizes forgot password emails based on whether the request came from admin or the storefront.
- `shipping-config` is public-readable so the storefront can calculate shipping and tax.
- `home` contains merchandising sections that can pull latest, featured, hottest, or category-based products.

## Custom Endpoints

Custom endpoints are registered in `src/endpoints/index.ts`.

Notable routes:

- `POST /api/payments/paystack/initiate`
- `POST /api/payments/paystack/confirm-order`
- `POST /api/validate-coupon`
- `POST /api/merge-guest-cart`
- `GET /api/analytics/metrics`
- `GET /api/analytics/revenue`
- `GET /api/analytics/top-products`
- `GET /api/analytics/low-inventory`
- `GET /api/analytics/recent-orders`
- `POST /api/webhook/resend`

## Frontend Notes

- The root layout wires up theme, auth, currency, query client, URL state, and cart providers.
- Cart state is restored from `localStorage` using `cartID` and `cartSecret`.
- Guest order tracking is available at `/track-order`.
- The footer links to several CMS-managed support pages, so confirm those pages exist in content before launch.

## Commands

| Command               | Purpose                              |
| --------------------- | ------------------------------------ |
| `pnpm dev`            | Start local development              |
| `pnpm devsafe`        | Clear `.next` then start development |
| `pnpm build`          | Production build                     |
| `pnpm start`          | Serve production build               |
| `pnpm generate:types` | Regenerate generated Payload types   |
| `pnpm payload`        | Payload CLI                          |
| `pnpm db:seed`        | Seed local demo data                 |
| `pnpm test:int`       | Integration tests                    |
| `pnpm test:e2e`       | End-to-end tests                     |
| `pnpm typecheck`      | TypeScript checks                    |

## Development Rules for This Codebase

- Do not edit `src/payload-types.ts` by hand.
- Use `priceInNGN` and NGN-aware amount fields rather than introducing a generic `price` abstraction.
- Check variant inventory before allowing selection or purchase.
- Prefer the existing access helpers in `src/access`.
- Keep UI additions consistent with the Tailwind and shadcn patterns already in use.

## Testing and Validation

- Integration tests live under `tests/int`
- End-to-end tests live under `tests/e2e`
- Use `pnpm typecheck` after schema or hook changes
- Run `pnpm generate:types` whenever collection or global schemas change

## Known Caveats

- `docker-compose.yml` still reflects the older template and references MongoDB. The active project uses PostgreSQL, so do not assume Docker is production-ready in its current state.
- The environment template includes `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, but the current payment flow relies on server-generated Paystack access codes rather than direct usage of that variable in app code.
- Several support pages are expected by navigation and footer links. Make sure corresponding CMS pages are published in each environment.

## Good First Reads in the Codebase

Start here if you are new to the project:

1. `src/payload.config.ts`
2. `src/plugins/index.ts`
3. `src/collections/products/index.ts`
4. `src/collections/orders.ts`
5. `src/endpoints/paystack/initiate/helpers.ts`
6. `src/endpoints/paystack/confirm/helpers.ts`
7. `src/providers/cart.tsx`
