import type { Endpoint } from 'payload'
import { subDays } from 'date-fns'
import type { Order } from '@/payload-types'
import { z } from 'zod'
import { hasPermission } from '@/access/utilities'
import { PERMISSIONS } from '@/lib/permissions'

interface ProductData {
  id: string
  title: string
  revenue: number
  quantity: number
}

type OrderItemWithTotal = NonNullable<Order['items']>[number] & {
  total?: number | null
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
    if (!req.user || !hasPermission(req.user, PERMISSIONS.PRODUCTS_READ)) {
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

    // Fetch ALL completed orders in the period (limit: 0 returns all)
    const data = await payload.find({
      collection: 'orders',
      where: {
        status: { equals: 'completed' },
        createdAt: {
          greater_than_equal: startDate.toISOString(),
          less_than_equal: endDate.toISOString(),
        },
      },
      limit: 0,
      depth: 2,
      sort: 'createdAt',
    })

    // Aggregate product sales
    const productMap = new Map<string, ProductData>()

    data.docs.forEach((order: Order) => {
      order.items?.forEach((item: OrderItemWithTotal) => {
        const product = item.product
        if (typeof product === 'object' && product !== null) {
          const productId = String(product.id)
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

    // Paginate the aggregated product list
    const startIndex = (page - 1) * limit
    const paginatedProducts = allProducts.slice(startIndex, startIndex + limit)
    const totalDocs = allProducts.length
    const totalPages = Math.ceil(totalDocs / limit)

    return Response.json({
      docs: paginatedProducts,
      totalDocs,
      totalPages,
      page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      pagingCounter: startIndex + 1,
    })
  } catch (error) {
    console.error('Error fetching top products:', error)
    return Response.json({ error: 'Failed to fetch top products' }, { status: 500 })
  }
}
