import type { CollectionBeforeChangeHook } from 'payload'

import crypto from 'crypto'

export const beforeChangeCart: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  // Re-activate an abandoned cart when items are being written to it
  if (operation === 'update' && data.items !== undefined && originalDoc?.status === 'abandoned') {
    data.status = 'active'
    data.abandonmentEmailSentAt = null
  }

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

    const variantIds: number[] = []
    const productOnlyIds: number[] = []

    for (const item of data.items) {
      if (item.variant) {
        variantIds.push(
          typeof item.variant === 'object' ? (item.variant as { id: number }).id : (item.variant as number),
        )
      } else if (item.product) {
        productOnlyIds.push(
          typeof item.product === 'object' ? (item.product as { id: number }).id : (item.product as number),
        )
      }
    }

    const [variantsResult, productsResult] = await Promise.all([
      variantIds.length
        ? req.payload.find({
            collection: 'variants',
            where: { id: { in: variantIds } },
            limit: variantIds.length,
            depth: 0,
            select: { [priceField]: true } as never,
          })
        : { docs: [] as { id: number }[] },
      productOnlyIds.length
        ? req.payload.find({
            collection: 'products',
            where: { id: { in: productOnlyIds } },
            limit: productOnlyIds.length,
            depth: 0,
            select: { [priceField]: true } as never,
          })
        : { docs: [] as { id: number }[] },
    ])

    const variantPrices = new Map<number, number>(
      variantsResult.docs.map((v) => [
        v.id as number,
        ((v as Record<string, unknown>)[priceField] as number) || 0,
      ]),
    )
    const productPrices = new Map<number, number>(
      productsResult.docs.map((p) => [
        p.id as number,
        ((p as Record<string, unknown>)[priceField] as number) || 0,
      ]),
    )

    let subtotal = 0
    for (const item of data.items) {
      if (item.variant) {
        const id =
          typeof item.variant === 'object'
            ? (item.variant as { id: number }).id
            : (item.variant as number)
        subtotal += (variantPrices.get(id) ?? 0) * item.quantity
      } else if (item.product) {
        const id =
          typeof item.product === 'object'
            ? (item.product as { id: number }).id
            : (item.product as number)
        subtotal += (productPrices.get(id) ?? 0) * item.quantity
      }
    }

    data.subtotal = subtotal
  } else {
    data.subtotal = 0
  }
}
