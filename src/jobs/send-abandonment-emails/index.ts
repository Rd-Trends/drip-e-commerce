import type { TaskHandler } from 'payload'
import { transporter } from '@/lib/mailer'
import { render } from '@react-email/components'
import { CartAbandonmentEmail } from '@/lib/emails/cart-abandonment'
import { validateCoupon } from '@/endpoints/coupons/helpers'
import { formatCurrency } from '@/utils/format-currency'
import type { Cart, Coupon, Product, User, Variant } from '@/payload-types'

function getCouponDescription(coupon: Coupon): string {
  if (coupon.type === 'percentage') return `${coupon.value}% off your order`
  if (coupon.type === 'fixed') return `${formatCurrency(coupon.fixedAmount ?? 0)} off your order`
  return 'Free shipping on your order'
}

async function findApplicableCoupon(
  cart: Cart,
  candidates: Coupon[],
  payload: Parameters<TaskHandler<'sendAbandonmentEmails'>>[0]['req']['payload'],
): Promise<Coupon | null> {
  if (candidates.length === 0) return null

  const userId =
    typeof cart.customer === 'object' && cart.customer
      ? (cart.customer as User).id
      : typeof cart.customer === 'number'
        ? cart.customer
        : null

  // validateCoupon rejects non-active carts; patch status for evaluation only
  const cartForValidation: Cart = { ...cart, status: 'active' }

  for (const coupon of candidates) {
    const result = await validateCoupon(coupon, cartForValidation, { payload, userId })
    if (result.valid) return coupon
  }

  return null
}

export const handler: TaskHandler<'sendAbandonmentEmails'> = async ({ req }) => {
  const payload = req.payload

  const { docs: abandonedCarts } = await payload.find({
    collection: 'carts',
    where: {
      and: [
        { status: { equals: 'abandoned' } },
        { abandonmentEmailSentAt: { exists: false } },
        { purchasedAt: { exists: false } },
        { customer: { exists: true } },
      ],
    },
    limit: 100,
    depth: 2,
  })

  if (abandonedCarts.length === 0) {
    return { output: { sent: 0 } }
  }

  const now = new Date().toISOString()
  const { docs: couponCandidates } = await payload.find({
    collection: 'coupons',
    where: {
      and: [
        { active: { equals: true } },
        { validFrom: { less_than_equal: now } },
        { validUntil: { greater_than_equal: now } },
      ],
    },
    depth: 0,
    limit: 0,
  })

  const serverURL = req.payload.config.serverURL || ''
  const emailFromAddress = process.env.EMAIL_FROM_ADDRESS || 'drip-fashion@drip.ng'
  const emailFromName = process.env.EMAIL_FROM_NAME || 'Drip Fashion'
  const from = `${emailFromName} <${emailFromAddress}>`

  // Build all emails in parallel
  const prepared = await Promise.all(
    abandonedCarts.map(async (cart) => {
      const customer = typeof cart.customer === 'object' ? (cart.customer as User) : null
      if (!customer?.email) return null

      if (!cart.items?.length) return null

      // Respect marketing email opt-out; treat missing value as opted-in (pre-existing accounts)
      if ((customer as User & { marketingEmails?: boolean | null }).marketingEmails === false) {
        return null
      }

      const customerName = customer.name?.split(' ')[0] || 'there'

      const items = (cart.items || []).map((item) => ({
        product: typeof item.product === 'number' ? null : (item.product as Product | null),
        variant: typeof item.variant === 'number' ? null : (item.variant as Variant | null),
        quantity: item.quantity,
      }))

      const applicableCoupon = await findApplicableCoupon(cart, couponCandidates as Coupon[], payload)
      const coupon = applicableCoupon
        ? { code: applicableCoupon.code, description: getCouponDescription(applicableCoupon) }
        : undefined

      const unsubscribeUrl = `${serverURL}/api/unsubscribe?userId=${customer.id}&email=${encodeURIComponent(customer.email)}`

      const html = await render(
        CartAbandonmentEmail({ customerName, items, subtotal: cart.subtotal ?? 0, coupon, unsubscribeUrl }),
      )

      return {
        cartId: cart.id,
        email: {
          to: customer.email,
          from,
          subject: `${customerName}, you left something behind — Drip Fashion`,
          html,
        },
      }
    }),
  )

  const readyEmails = prepared.filter((item) => item !== null)

  if (readyEmails.length === 0) {
    return { output: { sent: 0 } }
  }

  const sentTimestamp = new Date().toISOString()

  const results = await Promise.allSettled(
    readyEmails.map((item) => transporter.sendMail(item.email)),
  )

  const successfulCartIds: number[] = []
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      successfulCartIds.push(readyEmails[i].cartId)
    } else {
      payload.logger.error(
        result.reason,
        `[sendAbandonmentEmails] Failed to send email to cart ${readyEmails[i].cartId}`,
      )
    }
  })

  await Promise.all(
    successfulCartIds.map((cartId) =>
      payload.update({
        collection: 'carts',
        id: cartId,
        data: { abandonmentEmailSentAt: sentTimestamp },
        req,
      }),
    ),
  )

  const sent = successfulCartIds.length

  payload.logger.info(`[sendAbandonmentEmails] Sent ${sent} email(s)`)
  return { output: { sent } }
}
