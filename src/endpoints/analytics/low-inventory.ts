import type { Endpoint } from 'payload'
import type { Product, Variant } from '@/payload-types'
import { z } from 'zod'
import { checkRole } from '@/access/utilities'
import { STAFF_ROLES } from '@/lib/constants'

interface InventoryItem {
  id: string
  name: string
  type: 'product' | 'variant'
  inventory: number
}

const querySchema = z.object({
  threshold: z.coerce.number().positive().default(10),
})

export const getLowInventoryHandler: Endpoint['handler'] = async (req) => {
  try {
    const payload = req.payload
    if (!req.user || !checkRole(STAFF_ROLES, req.user)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { threshold: thresholdNum } = querySchema.parse(req.query)
    const lowInventoryItems: InventoryItem[] = []

    // Check products without variants
    const { docs: products } = await payload.find({
      collection: 'products',
      where: {
        enableVariants: { equals: false },
        inventory: { less_than_equal: thresholdNum, greater_than: 0 },
      },
      limit: 0,
    })

    products.forEach((product: Product) => {
      lowInventoryItems.push({
        id: String(product.id),
        name: product.title || 'Unknown Product',
        type: 'product',
        inventory: product.inventory || 0,
      })
    })

    // Check variants
    const { docs: variants } = await payload.find({
      collection: 'variants',
      where: {
        inventory: { less_than_equal: thresholdNum, greater_than: 0 },
      },
      depth: 1,
      limit: 0,
    })

    variants.forEach((variant: Variant) => {
      const product = typeof variant.product === 'object' ? variant.product : null
      const variantName = variant.title || 'Unknown Variant'
      const productTitle = product?.title || 'Unknown Product'

      lowInventoryItems.push({
        id: String(variant.id),
        name: `${productTitle} - ${variantName}`,
        type: 'variant',
        inventory: variant.inventory || 0,
      })
    })

    // Sort by inventory ascending
    lowInventoryItems.sort((a, b) => a.inventory - b.inventory)

    return Response.json({
      docs: lowInventoryItems,
      totalDocs: lowInventoryItems.length,
    })
  } catch (error) {
    console.error('Error fetching low inventory:', error)
    return Response.json({ error: 'Failed to fetch low inventory' }, { status: 500 })
  }
}
