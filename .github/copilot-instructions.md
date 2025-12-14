# Drip E-Commerce - AI Coding Assistant Guide

## Project Overview

Fashion-focused e-commerce platform built with Next.js 15, Payload CMS 3.0, and PostgreSQL. Target audience: youths, teens, young parents seeking classic and flashy styles. Currency is Nigerian Naira (NGN), payment via Paystack.

## Tech Stack Architecture

- **Framework**: Next.js 15 (App Router) with React 19, TypeScript
- **CMS**: Payload CMS 3.0 with PostgreSQL adapter
- **UI**: Tailwind CSS 4 + shadcn/ui components (`@/components/ui/`)
- **Payment**: Custom Paystack adapter at `src/plugins/paystack/`
- **Testing**: Vitest (integration), Playwright (e2e)
- **Package Manager**: pnpm with strict engines (Node 18.20.2+/20.9.0+)

## Key Architectural Patterns

### Route Groups Structure

- `src/app/(frontend)/` - Customer-facing pages (shop, checkout, products)
- `src/app/(payload)/` - Admin panel and API routes (`/admin`, `/api`)
- Both share separate layouts: frontend has `<Navbar />`, payload has custom styling

### Access Control System

Located in `src/access/`, uses **atomic access checkers**:

- `isAdmin()` - Role-based admin check via `checkRole(['admin'], user)`
- `isDocumentOwner()` - Returns `true` for admins, filters by `customer` field for users
- `adminOnly`, `adminOrSelf`, `adminOrPublishedStatus` - Composite access patterns
- `adminOnlyFieldAccess`, `customerOnlyFieldAccess` - Field-level restrictions
- Pattern: Export reusable `Access` functions, compose them in collections

### Payload Plugin Configuration

Centralized in `src/plugins/index.ts`:

- **E-commerce Plugin**: Overrides default collections via `ProductsCollection` in `src/collections/products/`
- **Currency**: Hardcoded to `NGN` with custom `priceInNGN` fields (not standard USD)
- **Customers**: Uses `users` collection slug with roles (`admin`, `customer`)
- **Payment**: Custom `paystackAdapter` with `initiatePayment` and `confirmOrder` handlers

### Product Variants System

Products support multi-option variants (e.g., size + color):

- `enableVariants` flag activates variant mode
- `variantTypes` → `variantOptions` relationships define available choices
- `variants.docs[]` contains actual SKUs with inventory tracking
- Gallery images can link to `variantOption` for per-variant display
- Frontend: `VariantSelector` component matches URL params to find inventory-available variants

### Type Safety

- `src/payload-types.ts` - Auto-generated from collections, **DO NOT edit manually**
- Regenerate: `pnpm generate:types` (also runs before build)
- Use `Product`, `User`, `Cart`, etc. imports from `@/payload-types`

## Development Workflows

### Commands

```bash
pnpm dev              # Start dev server (with NODE_OPTIONS=--no-deprecation)
pnpm devsafe          # Clean .next folder then start dev
pnpm build            # Build for production
pnpm test             # Run all tests (int + e2e)
pnpm test:int         # Vitest integration tests (tests/int/)
pnpm test:e2e         # Playwright e2e tests (tests/e2e/)
pnpm generate:types   # Regenerate payload-types.ts
pnpm payload          # Payload CLI access
```

### Environment Setup

- PostgreSQL connection: `DATABASE_URI` in `.env`
- Payload admin: `PAYLOAD_SECRET` (required)
- Paystack: `PAYSTACK_SECRET_KEY` for payments
- Public URL: `NEXT_PUBLIC_SERVER_URL` (default: `http://localhost:3000`)
- Docker: `docker-compose.yml` includes MongoDB (legacy) and optional Postgres

### Testing Strategy

- **Integration tests** (`vitest.config.mts`): API logic, uses jsdom environment
- **E2e tests** (`playwright.config.ts`): Frontend flows, auto-starts dev server at `:3000`
- Test files: `*.int.spec.ts` and `*.e2e.spec.ts` in `tests/` directory

## Project-Specific Conventions

### Import Aliases

- `@/*` → `src/*` (configured in `tsconfig.json`)
- `@payload-config` → `src/payload.config.ts`
- shadcn/ui components always imported from `@/components/ui/`

### Styling Patterns

- Use Tailwind utility classes, avoid custom CSS except `globals.css`
- shadcn/ui components configured via `components.json` (default style, no src dir)
- Use `clsx` or `tailwind-merge` for conditional classes

### Data Fetching

- Server components: Use `getPayload({ config: configPromise })` from `@payload-config`
- Example pattern (see `src/app/(frontend)/shop/page.tsx`):
  ```typescript
  const payload = await getPayload({ config: configPromise })
  const products = await payload.find({
    collection: 'products',
    draft: false,
    select: { title: true, slug: true, ... },
    where: { _status: { equals: 'published' } }
  })
  ```

### Authentication Flow

- Frontend: `AuthProvider` context in `src/providers/auth/`
- API calls: `/api/users/login`, `/api/users/create` with `credentials: 'include'`
- Access: `req.user` available in Payload hooks/access functions

### Paystack Integration

- Custom adapter in `src/plugins/paystack/` implements `PaymentAdapter` interface
- `initiatePayment`: Creates transaction with cart snapshot metadata
- `confirmOrder`: Verifies payment via Paystack SDK, updates order status
- Client-side: Uses `@paystack/inline-js` for popup checkout (see checkout pages)

## Critical Implementation Notes

1. **Variant Inventory**: Always check `matchingVariant.inventory > 0` before allowing selection (see `VariantSelector`)
2. **Currency Fields**: Use `priceInNGN`, not generic `price` - hardcoded throughout
3. **Access Patterns**: Compose atomic checkers (`isAdmin`, `isDocumentOwner`) rather than inline logic
4. **Live Preview**: Products support live preview via `generatePreviewPath` utility
5. **SEO Plugin**: Enabled with custom `generateTitle`/`generateURL` for products
6. **Lexical Editor**: Rich text uses `@payloadcms/richtext-lexical` with custom feature sets per field

## File Locations Quick Reference

- Collections: `src/collections/{users,products,categories,media}/index.ts`
- Access control: `src/access/*.ts`
- UI components: `src/components/{layout,product,cart,addresses,ui}/`
- Payload config: `src/payload.config.ts`
- Plugins: `src/plugins/{index,paystack}/`
- Frontend pages: `src/app/(frontend)/{page,shop,products,checkout}/`
- Admin: `src/app/(payload)/admin/[[...segments]]/page.tsx`

## When Adding Features

- New collections → Register in `payload.config.ts` collections array
- New access patterns → Create atomic checker in `src/access/`, compose it
- New payment methods → Add adapter in `src/plugins/`, register in `ecommercePlugin` config
- UI components → Use shadcn/ui or create in `src/components/`, follow existing structure
- Environment variables → Add to `.env`, document in this file if new
