# Coupon System Implementation

## Overview

The coupon system allows admins to create discount codes that customers can apply at checkout to receive percentage or fixed-amount discounts on their orders.

## Features

### Admin Features

- Create and manage coupons with unique codes
- Set discount type (percentage or fixed amount)
- Configure validity dates (start and end)
- Set minimum purchase requirements
- Limit total usage or per-user usage
- Restrict coupons to specific categories or products
- Track usage count and which users have used each coupon

### Customer Features

- Browse available coupons at `/coupons`
- Apply coupon codes at checkout
- See discount amount before completing purchase
- Discover coupons through hero banners on homepage

## Usage

### Creating a Coupon (Admin)

1. Navigate to Admin Panel → Coupons
2. Click "Create New"
3. Fill in required fields:
   - **Code**: Unique coupon code (e.g., `SAVE20`, `NEWYEAR2025`)
   - **Type**: Percentage or Fixed Amount
   - **Value**: Discount percentage (1-100) or fixed amount in Naira
   - **Valid From/Until**: Date range for coupon validity
4. Optional configurations:
   - Minimum purchase amount
   - Maximum discount cap (for percentage coupons)
   - Usage limits (total and per user)
   - Applicable categories/products
5. Toggle "Active" to enable the coupon
6. Save

### Applying a Coupon (Customer)

1. Add items to cart
2. Go to checkout
3. Scroll to the "Order Summary" section
4. Enter coupon code in the input field
5. Click "Apply"
6. Discount will be calculated and displayed
7. Complete payment with discounted total

### Coupon Discovery

**Homepage Hero Banners:**

- Admins can add coupon codes to hero slide badges
- Example: "Use code: SAVE20"

**Coupons Page:**

- Visit `/coupons` to see all active coupons
- Shows discount amount, validity period, and requirements
- Copy code directly from the page

## Technical Details

### Collections

- **`coupons`**: Stores coupon data with admin-only management

### API Endpoints

- **POST `/api/coupons/validate`**: Validates a coupon code for a specific cart

### Payment Flow Integration

1. Customer applies coupon at checkout
2. Coupon is validated (expiry, limits, cart eligibility)
3. Discount is calculated based on cart subtotal
4. `couponId` is passed to payment initiation
5. Discount is applied to total before payment
6. After successful payment, coupon usage is tracked
7. User is added to `usedBy` list and usage count increments

### Discount Calculation

- **Percentage**: `(subtotal × value) / 100`, capped by `maxDiscountAmount`
- **Fixed**: Direct amount in Naira (converted to kobo)
- Discount never exceeds cart subtotal

### Validation Rules

- Must be active
- Must be within validity dates
- Usage limit not exceeded (total and per-user)
- Meets minimum purchase requirement
- Cart contains applicable products/categories (if restricted)

## File Structure

```
src/
├── collections/
│   └── coupons.ts                 # Coupon collection definition
├── utils/
│   └── coupon-helpers.ts          # Validation and calculation logic
├── hooks/
│   └── use-coupon.ts              # React Query hook for validation
├── components/
│   └── cart/
│       └── coupon-input.tsx       # Coupon input UI component
├── app/(frontend)/
│   ├── api/coupons/validate/
│   │   └── route.ts               # Validation API endpoint
│   └── (site)/
│       ├── coupons/
│       │   └── page.tsx           # Public coupons listing page
│       └── checkout/
│           └── _components/
│               ├── checkout.tsx   # Updated with coupon state
│               └── order-summary.tsx  # Shows discount
└── plugins/paystack/
    ├── initiate-payment.ts        # Applies discount to payment
    └── confirm-order.ts           # Tracks usage after payment
```

## Example Coupon Configurations

### Percentage Discount

```
Code: SAVE20
Type: Percentage
Value: 20
Min Purchase: 5000 (₦5,000)
Max Discount: 2000 (₦2,000)
```

Result: 20% off orders over ₦5,000, capped at ₦2,000 discount

### Fixed Amount Discount

```
Code: FLAT500
Type: Fixed Amount
Value: 500 (₦500)
Min Purchase: 2000 (₦2,000)
```

Result: ₦500 off orders over ₦2,000

### Category-Specific Coupon

```
Code: FASHION10
Type: Percentage
Value: 10
Applicable Categories: [Fashion, Clothing]
```

Result: 10% off only on fashion/clothing items

### Limited Use Coupon

```
Code: FIRST100
Type: Percentage
Value: 15
Usage Limit: 100
Max Uses Per User: 1
```

Result: 15% off, only first 100 customers, one use per customer

## Notes

- All prices are stored in kobo (₦1 = 100 kobo) internally
- Discount is applied before tax calculation
- Single coupon per order (no stacking)
- Coupon codes are case-insensitive (automatically uppercased)
- Guest users can use coupons (tracked by usage count only)
- Authenticated users have per-user usage tracking
