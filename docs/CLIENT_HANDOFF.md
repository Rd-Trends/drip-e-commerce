# Client Handoff Guide

## Purpose

This document explains what the Drip platform includes, what the client team can manage from the admin panel, what external services the business depends on, and what should be checked regularly after launch.

## Important URLs

- Production storefront: `https://drip.ng/`
- Production admin panel: `https://drip.ng/admin`
- Staging environment: `https://dev.drip.ng/`
- Staging admin panel: `https://dev.drip.ng/admin`
- Coolify dashboard: `https://coolify.drip.ng/`
- Private GitHub repository: `https://github.com/drip-fashion/drip-fashion`

## What Has Been Delivered

Drip is a fashion e-commerce website with a connected admin panel. It supports browsing products, selecting variants such as size and color, adding items to cart, applying coupon codes, checking out through Paystack, receiving order emails, and tracking orders after purchase.

The admin side supports catalog management, homepage merchandising, general content pages, coupons, shipping and tax settings, user roles, and order monitoring.

## Customer-Facing Features

- Home page with CMS-managed hero slides and product sections
- Shop and category browsing
- Product detail pages with image galleries and size guide support
- Variant selection for products with options like size and color
- Cart and checkout flow
- Coupon application during checkout
- Guest checkout and signed-in checkout
- Customer account area for saved addresses and order history
- Guest order tracking using order ID and email address
- CMS-driven informational pages such as FAQs, contact, legal, and support content

## Admin Capabilities

### Catalog Management

The admin team can create and update:

- Products
- Categories
- Variant types and options
- Product variants and inventory
- Product images and media assets

Products support both simple inventory and multi-variant inventory. This means the team can manage stock at the product level or at the specific size and color combination level, depending on how the product is configured.

### Content Management

The admin panel can manage:

- Header navigation
- Footer navigation
- Home page hero slides
- Home page product sections
- Promotional banners
- General marketing pages
- Forms and form submissions

Marketing pages are block-based, so pages can be assembled from reusable sections such as content blocks, call-to-action sections, FAQs, and forms.

### Promotions and Coupons

Coupon management includes:

- Percentage or fixed-value discounts
- Date-based activation windows
- Minimum order amounts
- Usage limits
- Per-user usage restrictions
- Product or category restrictions

Coupons can be promoted in homepage hero badges and applied during checkout.

### Orders and Fulfillment

The team can:

- Review orders in the admin panel
- Track transaction records linked to orders
- Update order statuses
- Monitor recent orders from the dashboard

Available order statuses include:

- `processing`
- `shipped`
- `completed`
- `cancelled`
- `refunded`

### Shipping and Tax Settings

The platform includes editable shipping configuration for Nigeria:

- Default shipping fee
- State-by-state shipping fees
- Enable or disable delivery by state
- Free shipping threshold
- VAT or tax rate

### User and Staff Management

Supported roles are:

- `Administrator`: full access
- `Order Manager`: order operations and order-related analytics
- `Content Manager`: products, pages, media, coupons, and other content
- `Customer`: storefront account only

This allows the client to separate catalog work from fulfillment work without giving every staff member full control.

## Business Services That Must Remain Active

The project currently depends on the following services and credentials:

- Neon PostgreSQL database
- Paystack account and API secret
- Resend account and API key
- Cloudflare R2 media storage credentials
- Hostinger hosting environment for the Next.js app and Payload CMS
- Coolify project and deployment management access at `https://coolify.drip.ng/`
- Private GitHub repository access for source code and change management at `https://github.com/drip-fashion/drip-fashion`
- GO54 domain and DNS ownership for the storefront URLs

If any of these are changed, expired, or revoked, parts of the platform will stop working.

## Account and Credential Note

Most service passwords and login details are saved in Google Password Manager. If access is needed for Neon, Cloudflare R2, Resend, Hostinger, Coolify, or GitHub, the first place to check should be the client Google account password manager entries.

## Deployment and Configuration Notes

- Source code is stored in the private GitHub repository.
- Deployments are managed through Coolify.
- The live customer site runs on `https://drip.ng/`.
- The staging environment runs on `https://dev.drip.ng/`.
- The admin panel is available under `/admin` on both production and staging.

When moving hosting, changing environments, or handing over infrastructure, the following configuration items must be preserved correctly:

- Public app URL for each environment
- Payload secret
- Neon database connection string
- Paystack secret key and webhook configuration
- Resend API key and webhook configuration
- Cloudflare R2 bucket configuration and access credentials
- GO54-managed domain and DNS records for `drip.ng` and `dev.drip.ng`

## Day-to-Day Operating Checklist

Use this as a simple operational routine:

1. Review new orders and update statuses.
2. Check low inventory alerts in the admin dashboard.
3. Confirm new products have correct pricing, images, and stock.
4. Check active coupons and remove expired or outdated promotions.
5. Review form submissions and support inquiries.
6. Confirm shipping fees and tax settings still match business policy.
7. Monitor payment and email service health if customers report issues.

## Known Operational Notes

- The store is designed around Nigerian Naira and Nigerian shipping rules.
- Guest checkout is supported, so not every order will be attached to a registered customer account.
- Order confirmation depends on successful payment verification with Paystack.
- Transactional emails depend on Resend being correctly configured.
- The platform includes analytics widgets inside the admin dashboard, but they should be treated as operational summaries rather than a full BI reporting system.

## Suggested Next Business Steps

- Create a short internal SOP for how your team updates products, fulfills orders, and handles refunds.
