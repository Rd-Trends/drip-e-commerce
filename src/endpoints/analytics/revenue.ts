import type { Endpoint } from 'payload'
import { subDays, format, eachDayOfInterval } from 'date-fns'
import type { Order } from '@/payload-types'
import { z } from 'zod'
import { checkRole } from '@/access/utilities'
import { STAFF_ROLES } from '@/lib/constants'

const querySchema = z.object({
  period: z.coerce.number().positive().default(30),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
})

export const getRevenueHandler: Endpoint['handler'] = async (req) => {
  try {
    if (!req.user || !checkRole(STAFF_ROLES, req.user)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const payload = req.payload
    const {
      period,
      startDate: startDateParam,
      endDate: endDateParam,
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
    const { docs: orders } = await payload.find({
      collection: 'orders',
      where: {
        status: { equals: 'completed' },
        createdAt: {
          greater_than_equal: startDate.toISOString(),
          less_than_equal: endDate.toISOString(),
        },
      },
      limit: 0,
      sort: 'createdAt',
    })

    // Generate date intervals
    const intervals = eachDayOfInterval({ start: startDate, end: endDate })

    // Group orders by day
    const revenueData = intervals.map((date) => {
      const dateStr = format(date, 'MMM dd')

      const dayOrders = orders.filter((order: Order) => {
        const orderDate = new Date(order.createdAt)
        return format(orderDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      })

      const revenue = dayOrders.reduce(
        (sum: number, order: Order) => sum + (order.grandTotal || 0),
        0,
      )
      const orderCount = dayOrders.length

      return {
        date: dateStr,
        revenue,
        orders: orderCount,
        averageOrderValue: orderCount > 0 ? revenue / orderCount : 0,
      }
    })

    return Response.json({ data: revenueData })
  } catch (error) {
    console.error('Error fetching revenue data:', error)
    return Response.json({ error: 'Failed to fetch revenue data' }, { status: 500 })
  }
}
