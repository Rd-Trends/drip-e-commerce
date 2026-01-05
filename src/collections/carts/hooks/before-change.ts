import type { CollectionBeforeChangeHook } from 'payload'

import crypto from 'crypto'

export const beforeChangeCart: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  // Generate a secret for guest cart access on creation
  if (operation === 'create' && !data.customer && !data.secret) {
    // Generate a cryptographically secure random string
    const secret = crypto.randomBytes(20).toString('hex')
    data.secret = secret

    // Store in context so afterRead hook can include it in the creation response
    if (!req.context) {
      req.context = {}
    }
    req.context.newCartSecret = secret
  }

  // Update subtotal based on items in the cart
  if (data.items && Array.isArray(data.items)) {
    const priceField = `priceIn${data.currency}`

    let subtotal = 0

    for (const item of data.items) {
      if (item.variant) {
        const id = typeof item.variant === 'object' ? item.variant.id : item.variant

        const variant = await req.payload.findByID({
          id,
          collection: 'variants',
          depth: 0,
          select: {
            [priceField]: true,
          },
        })

        const price = (variant[priceField as keyof typeof variant] as number) || 0
        subtotal += price * item.quantity
      } else {
        const id = typeof item.product === 'object' ? item.product.id : item.product

        const product = await req.payload.findByID({
          id,
          collection: 'products',
          depth: 0,
          select: {
            [priceField]: true,
          },
        })

        const price = (product[priceField as keyof typeof product] as number) || 0
        subtotal += price * item.quantity
      }
    }

    data.subtotal = subtotal
  } else {
    data.subtotal = 0
  }
}
