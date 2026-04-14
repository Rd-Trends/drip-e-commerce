import type { Endpoint } from 'payload'
import { subDays } from 'date-fns'
import { Where } from 'payload'
import { z } from 'zod'
import { hasPermission } from '@/access/utilities'
import { PERMISSIONS } from '@/lib/permissions'

const querySchema = z.object({
  period: z.coerce.number().positive().optional(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  limit: z.coerce.number().positive().default(10),
})

export const getRecentOrdersHandler: Endpoint['handler'] = async (req) => {
  try {
    if (!req.user || !hasPermission(req.user, PERMISSIONS.ORDERS_READ)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const payload = req.payload
    const {
      period,
      startDate: startDateParam,
      endDate: endDateParam,
      limit: limitNum,
    } = querySchema.parse(req.query)

    // Determine date range
    let startDate: Date | undefined
    let endDate: Date | undefined

    if (startDateParam && endDateParam) {
      // Custom date range
      startDate = new Date(startDateParam)
      endDate = new Date(endDateParam)
    } else if (period) {
      // Predefined period
      endDate = new Date()
      startDate = subDays(endDate, period)
    }

    // Build where clause
    const where: Where = {}
    if (startDate && endDate) {
      where.createdAt = {
        greater_than_equal: startDate.toISOString(),
        less_than_equal: endDate.toISOString(),
      }
    }

    const { docs: orders } = await payload.find({
      collection: 'orders',
      where,
      limit: limitNum,
      sort: '-createdAt',
      depth: 1,
    })

    return Response.json({ docs: orders })
  } catch (error) {
    console.error('Error fetching recent orders:', error)
    return Response.json({ error: 'Failed to fetch recent orders' }, { status: 500 })
  }
}
