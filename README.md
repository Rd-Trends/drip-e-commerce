# Drip E-Commerce

Fashion-focused e-commerce platform built with Next.js 15, Payload CMS 3, PostgreSQL, Tailwind CSS, Paystack, and Resend. The storefront targets Nigerian shoppers and is configured around NGN pricing, variant-based inventory, guest or authenticated checkout, and CMS-driven merchandising.

## Documentation Map

- [docs/CLIENT_HANDOFF.md](docs/CLIENT_HANDOFF.md) - business and operations guide for the client team
- [docs/DEVELOPER_ONBOARDING.md](docs/DEVELOPER_ONBOARDING.md) - technical onboarding guide for engineers
- [dcos/COUPON_SYSTEM.md](dcos/COUPON_SYSTEM.md) - focused notes on coupon behavior and implementation

## Platform Summary

- Storefront built with the Next.js App Router and React 19
- Payload CMS admin panel at `/admin` for catalog, content, promotions, shipping, and users
- PostgreSQL as the primary database via `@payloadcms/db-postgres`
- S3-compatible object storage for media uploads
- Paystack payment flow with server-side transaction verification
- Resend-powered transactional email for forgot password and order notifications
- Custom analytics widgets in the admin dashboard for revenue, recent orders, and low inventory

## Quick Start

1. Install Node.js `18.20.2+` or `20.9.0+` and `pnpm`.
2. Copy `.env.example` to `.env` and fill in the required service credentials.
3. Start PostgreSQL and ensure `DATABASE_URI` points to it.
4. Run `pnpm install`.
5. Run `pnpm payload migrate` if the database is new.
6. Run `pnpm dev`.
7. Open `http://localhost:3000` for the storefront and `http://localhost:3000/admin` for the CMS.

Optional local seed:

- Run `pnpm db:seed` to load demo content, sample merchandising data, shipping config, and local-only staff accounts.

## Useful Commands

| Command               | Purpose                                        |
| --------------------- | ---------------------------------------------- |
| `pnpm dev`            | Start the development server                   |
| `pnpm devsafe`        | Clear `.next` and start the development server |
| `pnpm build`          | Production build                               |
| `pnpm start`          | Serve the production build                     |
| `pnpm generate:types` | Regenerate `src/payload-types.ts`              |
| `pnpm payload`        | Run Payload CLI commands                       |
| `pnpm db:seed`        | Seed demo data                                 |
| `pnpm test:int`       | Run integration tests                          |
| `pnpm test:e2e`       | Run Playwright tests                           |
| `pnpm test`           | Run all tests                                  |
| `pnpm typecheck`      | Run TypeScript type checking                   |

## Key Business Capabilities

- Variant-aware product catalog with size and color combinations
- Product inventory tracking at both product and variant level
- Cart persistence for guests and signed-in users, with guest cart merge support
- Checkout flow with shipping, tax, coupon discounts, and Paystack payment confirmation
- Customer account area for profile, addresses, and order history
- Guest order tracking via order ID and email address
- CMS-managed home page, header, footer, banners, and block-based marketing pages
- Coupon system with date limits, usage limits, and category or product restrictions
- Staff roles for administrators, content managers, and order managers

## Important Project Notes

- The store is hardcoded to `NGN` and Nigerian shipping logic.
- `src/payload-types.ts` is generated; do not edit it manually.
- The existing `docker-compose.yml` is still based on the original template and references MongoDB. The live codebase uses PostgreSQL, so update that file before using Docker for local development.
- Paystack order confirmation and transactional emails depend on valid environment variables and external service access.

## Recommended Reading Order

1. Read [docs/CLIENT_HANDOFF.md](docs/CLIENT_HANDOFF.md) if you need a client-safe overview of what the platform includes and how it is operated.
2. Read [docs/DEVELOPER_ONBOARDING.md](docs/DEVELOPER_ONBOARDING.md) if you are setting up the project, extending features, or supporting deployments.
