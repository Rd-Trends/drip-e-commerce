# Coupon Implementation Guide

## Purpose

This document explains how the coupon system is implemented today and what needs to stay aligned when anyone changes or extends it.

It is written for engineers working on:

- coupon rules,
- checkout and order totals,
- payment initiation and confirmation,
- admin coupon fields,
- guest checkout behavior,
- or tests for coupon behavior.

This is not a marketing or user-facing overview. It is an implementation guide for maintainers.

## High-Level Architecture

The coupon system spans four layers:

1. coupon data model in Payload,
2. coupon validation and discount calculation logic,
3. checkout and payment integration,
4. order attribution and usage enforcement.

The main design principle is that coupon validation is server-authoritative. The frontend only requests validation and renders the result.

## Main Files

### Data Model

- `src/collections/coupons/index.ts`
- `src/collections/orders.ts`

### Validation and API

- `src/endpoints/coupons/helpers.ts`
- `src/endpoints/coupons/validate.ts`
- `src/endpoints/index.ts`

### Payment Integration

- `src/endpoints/paystack/initiate/helpers.ts`
- `src/endpoints/paystack/confirm/helpers.ts`
- `src/endpoints/paystack/shared/types.ts`

### Frontend Integration

- `src/hooks/use-coupon.ts`
- `src/components/cart/coupon-input.tsx`
- checkout components that hold applied coupon state and pass customer email into validation

### Tests

- `tests/int/coupons.int.spec.ts`

## Coupon Data Model

The coupon collection lives in `src/collections/coupons/index.ts`.

Core fields:

- `code`: unique, normalized to uppercase in a `beforeChange` hook.
- `type`: one of `percentage`, `fixed`, or `free-shipping`.
- `value`: percentage value for percentage coupons.
- `fixedAmount`: fixed discount amount.
- `minPurchaseAmount`: minimum cart subtotal required.
- `maxDiscountAmount`: cap for percentage discounts.
- `validFrom` and `validUntil`: active date window.
- `active`: admin toggle.
- `usageLimit`: total allowed redemptions.
- `maxUsesPerUser`: allowed redemptions per customer.
- `applicableCategories` and `applicableProducts`: optional restriction filters.
- `description`: internal/admin description.

Current collection access is staff-only for reads. Public clients do not browse coupons directly. Coupon lookup for checkout is done through internal API handlers using `overrideAccess: true` where needed.

### Important Constraints

- Coupon codes are case-insensitive because they are normalized to uppercase at write time and queried with uppercase normalization at validation time.
- `value` only applies to `percentage` coupons.
- `fixedAmount` only applies to `fixed` coupons.
- `free-shipping` coupons return `freeShipping: true` and `discount: 0` from validation.

## Order Attribution Model

Orders live in `src/collections/orders.ts` and currently store coupon attribution with:

- `coupon`: relationship to the coupon document.
- `couponCode`: immutable snapshot of the code used when the order was placed.
- `discount`: already-existing monetary snapshot of the applied discount.

This matters because coupon enforcement should rely on order history, not on mutable coupon-document arrays.

### Why Order Attribution Exists

It allows the system to answer:

- which orders used a coupon,
- how many times a customer has redeemed a coupon,
- and what code was actually used at the time of purchase even if the coupon is edited later.

## Validation Flow

The validation endpoint is exposed through `POST /api/validate-coupon` and registered in `src/endpoints/index.ts`.

### Request Shape

The request body currently includes:

- `code`
- `cartId`
- `cartSecret` for guest carts
- `customerEmail` for guest enforcement

### Handler Responsibilities

`src/endpoints/coupons/validate.ts` is responsible for:

1. validating required request fields,
2. requiring `cartSecret` for guest cart access,
3. loading the coupon internally by code,
4. loading the cart with normal cart access enforcement,
5. calling the shared validation helper,
6. returning only the frontend-safe data required to render the applied coupon.

### Shared Validation Logic

`src/endpoints/coupons/helpers.ts` is the single place where coupon rule evaluation happens.

It currently handles:

- cart state validation,
- active flag checks,
- validity window checks,
- global usage limit checks,
- per-customer usage checks,
- minimum purchase checks,
- restricted-item eligibility checks,
- and discount calculation.

Any new coupon rule should be added here first, then reused by both checkout validation and payment initiation.

## Usage Enforcement Model

The current enforcement model is order-based.

`countCouponAttributedOrders` in `src/endpoints/coupons/helpers.ts` queries the orders collection, filtered by:

- `coupon`,
- non-cancelled and non-refunded statuses,
- and either `customer` or normalized `customerEmail`.

This means:

- global usage limits are counted from attributed orders,
- authenticated customer limits are counted from orders with the same `customer`,
- guest limits are counted from orders with the same normalized `customerEmail`.

### Invariants

If you change enforcement, keep these invariants intact:

- guest and authenticated customers must both be enforceable,
- cancelled and refunded orders must not count as redemptions,
- coupon usage checks must not depend on admin-only display fields,
- and order attribution must stay in sync with confirmation logic.

## Restricted Coupon Logic

Restricted coupons use category and product matching.

This is implemented in `src/endpoints/coupons/helpers.ts` through:

- `getCouponRestrictionState`
- `isCouponApplicableToItem`
- `calculateApplicableSubtotal`

### Important Behavior

Restricted coupons do not discount the full cart subtotal unless every relevant item is eligible.

Instead:

- minimum purchase checks still use full cart subtotal,
- discount calculation uses eligible subtotal only.

That distinction is intentional. If you change it, document the business reason clearly and update tests.

## Payment Integration

Coupons influence payment in two places.

### Payment Initiation

`src/endpoints/paystack/initiate/helpers.ts` reuses the shared coupon helper to calculate:

- discount amount,
- coupon id,
- coupon code snapshot,
- and free-shipping behavior.

That result affects:

- adjusted subtotal before tax,
- final shipping fee,
- grand total sent to Paystack,
- metadata stored on the initialized payment.

### Payment Metadata

`src/endpoints/paystack/shared/types.ts` defines the metadata passed to Paystack.

Coupon-related metadata currently includes:

- `couponId`
- `couponCode`
- `customerEmail`
- `customerUserId`

Those fields are important because confirmation may happen in a different authenticated context than initiation.

### Payment Confirmation

`src/endpoints/paystack/confirm/helpers.ts` verifies the Paystack transaction and creates the order.

At confirmation time it resolves customer identity from:

1. the current authenticated user if present,
2. metadata `customerUserId`,
3. transaction relation fallback,
4. normalized email fallback.

Then it writes:

- order totals,
- shipping info,
- cart snapshot,
- coupon relationship,
- coupon code snapshot.

If you add new coupon-related order state, confirmation is usually the correct place to write it.

## Frontend Flow

The coupon input UI lives in `src/components/cart/coupon-input.tsx`.

Important frontend behaviors:

- coupon application is disabled until a customer email exists,
- guest carts rely on `cartSecret` from the cart provider,
- the frontend only stores the applied coupon display state,
- the backend remains the source of truth for validation and totals.

The request hook in `src/hooks/use-coupon.ts` automatically threads `cartSecret` into validation requests.

### Frontend Invariants

- do not compute coupon discounts only in the client,
- do not expose coupon internals that the server does not need to return,
- and keep any applied-coupon state compatible with the payment initiation request shape.

## Extension Guidelines

### If You Add a New Coupon Type

You will likely need to update all of the following:

1. `src/collections/coupons/index.ts` field options and admin conditions.
2. `calculateDiscount` in `src/endpoints/coupons/helpers.ts`.
3. any extra restriction logic in `validateCoupon`.
4. payment initiation in `src/endpoints/paystack/initiate/helpers.ts` if totals are affected differently.
5. frontend coupon labels in the coupon input and checkout summary.
6. tests in `tests/int/coupons.int.spec.ts`.
7. migrations and regenerated types if the schema changes.

### If You Change Usage Rules

Keep these pieces aligned:

1. validation logic in `src/endpoints/coupons/helpers.ts`.
2. order attribution fields in `src/collections/orders.ts`.
3. payment confirmation persistence in `src/endpoints/paystack/confirm/helpers.ts`.
4. test coverage for both authenticated and guest customers.

### If You Change Coupon Access Rules

Be careful with public exposure.

Coupon collection reads are intentionally restricted. If you relax that, you may reintroduce:

- code leakage,
- campaign visibility,
- and easier scraping of active discount rules.

If you need public coupon discovery in the future, prefer a purpose-built endpoint that returns only curated public fields.

## Common Pitfalls

### 1. Breaking Guest Checkout

Guest coupon validation depends on both:

- `cartSecret`
- `customerEmail`

If either is removed from the request flow, guests will either fail validation or bypass intended enforcement.

### 2. Reintroducing Full-Cart Discounting for Restricted Coupons

Do not pass raw `cart.subtotal` into discount calculation for restricted coupons unless that is a deliberate rule change.

### 3. Counting the Wrong Orders

Usage checks should not count:

- cancelled orders,
- refunded orders,
- or orders without the coupon relation.

### 4. Trusting Frontend State Too Much

The applied coupon shown in the UI is not authoritative. Payment initiation and confirmation must still rely on server-side validation and stored metadata.

### 5. Forgetting Types and Migrations

If you change coupon or order schema fields:

1. generate a migration,
2. run `pnpm generate:types`,
3. update any tests or metadata types that rely on those fields.

## Testing Guidance

Current focused coverage lives in `tests/int/coupons.int.spec.ts`.

That suite currently covers:

- eligible-subtotal discount calculation,
- restricted fixed-discount capping,
- invalid cart state rejection,
- per-user usage enforcement from attributed orders,
- global usage enforcement from attributed orders,
- guest usage enforcement from attributed orders,
- and guest cart secret enforcement in the validation endpoint.

### When Changing Coupon Logic

At minimum run:

- `pnpm vitest run tests/int/coupons.int.spec.ts`
- `pnpm typecheck`

For broader changes also run:

- `pnpm test:int`

Add coverage when changing:

- coupon types,
- order attribution,
- guest validation identity,
- restriction matching,
- or payment metadata.

## Recommended Change Workflow

When making coupon changes, use this sequence:

1. update the business rule in the shared validation helper,
2. update any required schema fields,
3. update payment initiation and confirmation if totals or persistence change,
4. update frontend request/response expectations,
5. add or adjust integration tests,
6. run focused verification before broader tests.

## Known Future Work

The current system is in better shape than the original version, but maintainers should be aware of likely future work:

- explicit confirmation-time coupon revalidation policy,
- coupon exception handling after payment capture,
- optional admin reporting built from order attribution rather than coupon summary state,
- and possibly a curated public coupon discovery mechanism if the product ever requires it.

## Summary

If you only remember three things, remember these:

1. `src/endpoints/coupons/helpers.ts` is the core rules engine.
2. orders, not coupon arrays, are the authoritative usage record.
3. guest coupon flows depend on both email identity and cart secret access.
