import type { PayloadHandler } from 'payload'
import { checkRole } from '@/access/utilities'
import { subDays } from 'date-fns'

export const orderStatusAnalyticsHandler: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user || !checkRole(['admin'], user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(
      req.url || '',
      process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
    )
    const period = searchParams.get('period') || '30'

    const endDate = new Date()
    const startDate = subDays(endDate, parseInt(period))

    // Fetch all orders in period
    const { docs: orders } = await payload.find({
      collection: 'orders',
      where: {
        createdAt: { greater_than_equal: startDate.toISOString() },
      },
      limit: 10000,
    })

    // Count by status
    const statusCounts = {
      processing: 0,
      completed: 0,
      cancelled: 0,
      refunded: 0,
    }

    orders.forEach((order) => {
      if (order.status && order.status in statusCounts) {
        statusCounts[order.status as keyof typeof statusCounts]++
      }
    })

    // Get recent orders
    const { docs: recentOrders } = await payload.find({
      collection: 'orders',
      limit: 10,
      sort: '-createdAt',
      select: {
        id: true,
        grandTotal: true,
        status: true,
        createdAt: true,
        customerEmail: true,
      },
    })

    return Response.json({
      statusDistribution: statusCounts,
      recentOrders: recentOrders.map((order) => ({
        id: String(order.id),
        orderNumber: order.id,
        total: order.grandTotal || 0,
        status: order.status || 'processing',
        customerEmail: order.customerEmail || 'Guest',
        createdAt: order.createdAt,
      })),
      period: parseInt(period),
    })
  } catch (error) {
    console.error('Order status analytics error:', error)
    return Response.json({ error: 'Failed to fetch order status data' }, { status: 500 })
  }
}
