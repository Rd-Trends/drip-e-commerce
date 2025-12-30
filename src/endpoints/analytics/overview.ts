import { checkRole } from '@/access/utilities'
import { subDays } from 'date-fns'
import { PayloadHandler } from 'payload'

/**
 * Analytics Overview Handler
 * Returns key metrics: revenue, orders, customers, conversion rate
 */
export const analyticsOverviewHandler: PayloadHandler = async (req) => {
  const { payload, user } = req

  // Check admin access
  if (!user || !checkRole(['admin'], user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const period = (req.query?.period || '30') as string // Default to last 30 days

    // Calculate date range
    const endDate = new Date()
    const startDate = subDays(endDate, parseInt(period))

    // Fetch completed orders
    const { docs: completedOrders } = await payload.find({
      collection: 'orders',
      where: {
        status: { equals: 'completed' },
        createdAt: { greater_than_equal: startDate.toISOString() },
      },
      limit: 10000,
    })

    // Fetch processing orders
    const { docs: processingOrders } = await payload.find({
      collection: 'orders',
      where: {
        status: { equals: 'processing' },
        createdAt: { greater_than_equal: startDate.toISOString() },
      },
      limit: 10000,
    })

    // Combine all orders for overall metrics
    const allOrders = [...completedOrders, ...processingOrders]

    // Fetch all transactions for conversion rate
    const { docs: transactions } = await payload.find({
      collection: 'transactions',
      where: {
        createdAt: { greater_than_equal: startDate.toISOString() },
      },
      limit: 10000,
    })

    // Calculate metrics for completed orders
    const completedRevenue = completedOrders.reduce(
      (sum, order) => sum + (order.grandTotal || 0),
      0,
    )
    const completedOrderCount = completedOrders.length

    // Calculate metrics for processing orders
    const processingRevenue = processingOrders.reduce(
      (sum, order) => sum + (order.grandTotal || 0),
      0,
    )
    const processingOrderCount = processingOrders.length

    // Calculate overall metrics
    const totalRevenue = completedRevenue + processingRevenue
    const totalOrders = allOrders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Count unique customers (exclude guests)
    const uniqueCustomers = new Set(
      allOrders.filter((order) => order.customer).map((order) => order.customer),
    ).size

    // Calculate conversion rate
    const successfulTransactions = transactions.filter((t) => t.status === 'succeeded').length
    const totalTransactions = transactions.length
    const conversionRate =
      totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0

    // Calculate growth vs previous period
    const previousStartDate = subDays(startDate, parseInt(period))

    // Fetch previous completed orders
    const { docs: previousCompletedOrders } = await payload.find({
      collection: 'orders',
      where: {
        status: { equals: 'completed' },
        createdAt: {
          greater_than_equal: previousStartDate.toISOString(),
          less_than: startDate.toISOString(),
        },
      },
      limit: 10000,
    })

    // Fetch previous processing orders
    const { docs: previousProcessingOrders } = await payload.find({
      collection: 'orders',
      where: {
        status: { equals: 'processing' },
        createdAt: {
          greater_than_equal: previousStartDate.toISOString(),
          less_than: startDate.toISOString(),
        },
      },
      limit: 10000,
    })

    const previousAllOrders = [...previousCompletedOrders, ...previousProcessingOrders]
    const previousRevenue = previousAllOrders.reduce(
      (sum, order) => sum + (order.grandTotal || 0),
      0,
    )
    const revenueGrowth =
      previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0

    const previousOrderCount = previousAllOrders.length
    const orderGrowth =
      previousOrderCount > 0 ? ((totalOrders - previousOrderCount) / previousOrderCount) * 100 : 0

    return Response.json({
      metrics: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        uniqueCustomers,
        conversionRate,
        revenueGrowth,
        orderGrowth,
        // Breakdown by status
        completed: {
          revenue: completedRevenue,
          orders: completedOrderCount,
        },
        processing: {
          revenue: processingRevenue,
          orders: processingOrderCount,
        },
      },
      period: parseInt(period),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    })
  } catch (error) {
    console.error('Analytics overview error:', error)
    return Response.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
