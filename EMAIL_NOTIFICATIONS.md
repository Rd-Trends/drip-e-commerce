# Email Notification System

## Overview

The email notification system sends automated order confirmation emails to customers when an order is placed.

## Components

### 1. Order Confirmation Email Template

**Location**: `src/lib/emails/order-confirmation.tsx`

A beautifully designed email template that includes:

- Order confirmation message
- Order number and date
- Shipping address
- Order items with images and variant details
- Order summary (subtotal, shipping, tax, discount, total)
- View order details button
- Help section with useful links
- Company footer

The template uses:

- `@react-email/components` for email-safe React components
- Tailwind CSS with custom config matching Drip's design system
- Nigerian Naira (NGN) currency formatting
- Proper price calculation for products and variants

### 2. Email Hook

**Location**: `src/collections/oder.ts`

An `afterChange` hook that:

- Triggers when an order is created (`operation === 'create'`)
- Triggers when order status changes to `'processing'`
- Fetches the full order with populated relations (depth: 2)
- Renders the email template to HTML using `@react-email/components`
- Sends the email via Payload's email adapter
- Logs success/failure for debugging

### 3. Email Index Export

**Location**: `src/lib/emails/index.ts`

Centralized exports for all email templates for cleaner imports.

## Configuration

### Email Adapter

The project uses `@payloadcms/email-nodemailer` configured in `src/payload.config.ts`:

```typescript
email: nodemailerAdapter()
```

### Environment Variables

Configure your email transport in `.env`:

```bash
# Email Configuration (examples)
EMAIL_FROM=noreply@drip-ecommerce.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

For development, Nodemailer can use services like:

- Gmail (requires app password)
- SendGrid
- Mailgun
- Amazon SES
- Or custom SMTP server

## Usage

### Automatic Sending

Emails are sent automatically when:

1. A new order is created
2. An order status is updated to 'processing'

No manual intervention required!

### Manual Testing

To test the email system:

1. Create a test order through the checkout flow
2. Check the console/logs for email sending status
3. For development, use a service like [Ethereal Email](https://ethereal.email/) to catch test emails

### Email Preview

To preview the email template during development:

```bash
# Install react-email CLI
pnpm add -D react-email

# Add script to package.json
"email:dev": "email dev"

# Run the preview server
pnpm email:dev
```

This opens a browser at `http://localhost:3000` where you can preview all email templates.

## Customization

### Styling

The email uses the Tailwind config from `src/lib/emails/tailwind.config.ts` which matches Drip's design system:

- Primary color: `oklch(0.13 0.028 261.692)`
- Background: White
- Muted: Light gray
- Border: Subtle gray

Update this file to change email colors globally.

### Content

To modify email content:

1. Edit `src/lib/emails/order-confirmation.tsx`
2. Update text, layout, or add new sections
3. Save and emails will automatically use the new template

### Logo

Place your logo at `public/logo.png` (120x40px recommended) or update the path in the template:

```typescript
const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
// Used in: src={`${baseUrl}/logo.png`}
```

### Hook Behavior

To change when emails are sent, modify the condition in `src/collections/oder.ts`:

```typescript
// Current: Send on create or when status becomes 'processing'
if (operation === 'create' || (operation === 'update' && doc.status === 'processing')) {
  // ...
}

// Example: Only send on create
if (operation === 'create') {
  // ...
}

// Example: Send on any status change
if (operation === 'update' && prevDoc.status !== doc.status) {
  // ...
}
```

## Troubleshooting

### Emails not sending

1. Check Payload logs for error messages
2. Verify email adapter configuration in `payload.config.ts`
3. Ensure `customerEmail` field is populated on orders
4. Check environment variables for SMTP credentials

### Emails look broken

1. Test with email clients (Gmail, Outlook, etc.)
2. Use [Litmus](https://litmus.com/) or [Email on Acid](https://www.emailonacid.com/) for testing
3. Keep styles inline-compatible (Tailwind compiles to inline styles)
4. Avoid advanced CSS (flexbox, grid may not work in all clients)

### Missing order data

If order data is incomplete:

1. Increase depth in `payload.findByID()` call (currently set to 2)
2. Check that relations are properly populated
3. Verify field access permissions don't block data

## Best Practices

1. **Test emails in multiple clients** - Email rendering varies widely
2. **Keep images optimized** - Large images slow email loading
3. **Use alt text** - For accessibility and when images don't load
4. **Provide plain text alternative** - Consider adding text-only version
5. **Monitor delivery rates** - Use email service analytics
6. **Handle errors gracefully** - Don't block order creation if email fails
7. **Log email events** - Track sends, opens, clicks for analytics

## Future Enhancements

Consider adding:

- Shipping notification email
- Delivery confirmation email
- Order cancellation email
- Order refund email
- Review request email
- Abandoned cart reminder email
- Welcome email for new customers
- Plain text email versions
- Email templates for admin notifications
- Internationalization (i18n) for multi-language support
