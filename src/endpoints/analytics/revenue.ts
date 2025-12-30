import type { PayloadHandler } from 'payload'
import { checkRole } from '@/access/utilities'
import { subDays, subMonths, format, eachDayOfInterval, eachMonthOfInterval } from 'date-fns'

export const revenueAnalyticsHandler: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user || !checkRole(['admin'], user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const period = (req.query?.period || '30') as string // Default to last 30 days
    const groupBy = (req.query?.groupBy || 'day') as string // day or month

    const endDate = new Date()
    let startDate: Date

    if (groupBy === 'month') {
      startDate = subMonths(endDate, 12) // Last 12 months
    } else {
      startDate = subDays(endDate, parseInt(period))
    }

    // Fetch orders
    const { docs: orders } = await payload.find({
      collection: 'orders',
      where: {
        status: { equals: 'completed' },
        createdAt: { greater_than_equal: startDate.toISOString() },
      },
      limit: 10000,
      sort: 'createdAt',
    })

    // Generate date intervals
    const intervals =
      groupBy === 'month'
        ? eachMonthOfInterval({ start: startDate, end: endDate })
        : eachDayOfInterval({ start: startDate, end: endDate })

    // Group orders by interval
    const revenueData = intervals.map((date) => {
      const dateStr = groupBy === 'month' ? format(date, 'MMM yyyy') : format(date, 'MMM dd')

      const intervalOrders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt)
        if (groupBy === 'month') {
          return (
            orderDate.getMonth() === date.getMonth() &&
            orderDate.getFullYear() === date.getFullYear()
          )
        } else {
          return format(orderDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        }
      })

      const revenue = intervalOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0)
      const orderCount = intervalOrders.length

      return {
        date: dateStr,
        revenue,
        orders: orderCount,
        averageOrderValue: orderCount > 0 ? revenue / orderCount : 0,
      }
    })

    return Response.json({
      data: revenueData,
      groupBy,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    })
  } catch (error) {
    console.error('Revenue analytics error:', error)
    return Response.json({ error: 'Failed to fetch revenue data' }, { status: 500 })
  }
}
