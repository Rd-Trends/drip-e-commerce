import type { Endpoint } from 'payload'
import { subDays } from 'date-fns'
import type { Order } from '@/payload-types'
import { z } from 'zod'
import { checkRole } from '@/access/utilities'
import { STAFF_ROLES } from '@/lib/constants'

interface ProductData {
  id: string
  title: string
  revenue: number
  quantity: number
}

const querySchema = z.object({
  period: z.coerce.number().positive().default(30),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().default(10),
})

export const getTopProductsHandler: Endpoint['handler'] = async (req) => {
  try {
    if (!req.user || !checkRole(STAFF_ROLES, req.user)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const payload = req.payload

    // Safely parse query parameters with defaults
    const {
      period,
      startDate: startDateParam,
      endDate: endDateParam,
      page,
      limit,
    } = querySchema.parse(req.query)

    // Determine date range
    let startDate: Date
    let endDate = new Date()

    if (startDateParam && endDateParam) {
      // Custom date range
      startDate = new Date(startDateParam)
      endDate = new Date(endDateParam)
    } else {
      // Predefined period
      startDate = subDays(endDate, period)
    }

    // Fetch completed orders
    const data = await payload.find({
      collection: 'orders',
      where: {
        status: { equals: 'completed' },
        createdAt: {
          greater_than_equal: startDate.toISOString(),
          less_than_equal: endDate.toISOString(),
        },
      },
      limit,
      page,
      depth: 2,
      sort: 'createdAt',
    })

    // Aggregate product sales
    const productMap = new Map<string, ProductData>()

    data.docs.forEach((order: Order) => {
      order.items?.forEach((item: any) => {
        const product = item.product
        if (typeof product === 'object' && product !== null) {
          const productId = product.id
          const existing = productMap.get(productId)

          if (existing) {
            existing.revenue += item.total || 0
            existing.quantity += item.quantity || 0
          } else {
            productMap.set(productId, {
              id: productId,
              title: product.title || 'Unknown Product',
              revenue: item.total || 0,
              quantity: item.quantity || 0,
            })
          }
        }
      })
    })

    // Sort by revenue
    const allProducts = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue)

    return Response.json({
      ...data,
      docs: allProducts,
    })
  } catch (error) {
    console.error('Error fetching top products:', error)
    return Response.json({ error: 'Failed to fetch top products' }, { status: 500 })
  }
}
