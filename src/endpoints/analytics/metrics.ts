import type { Endpoint } from 'payload'
import { subDays } from 'date-fns'
import type { Transaction } from '@/payload-types'
import { z } from 'zod'
import { hasPermission } from '@/access/utilities'
import { PERMISSIONS } from '@/lib/permissions'

interface MetricsData {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  uniqueCustomers: number
  conversionRate: number
  revenueGrowth: number
  orderGrowth: number
}

const querySchema = z.object({
  period: z.coerce.number().positive().default(30),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
})

export const getMetricsHandler: Endpoint['handler'] = async (req) => {
  try {
    if (!req.user || !hasPermission(req.user, PERMISSIONS.ANALYTICS_VIEW)) {
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
    const { docs: completedOrders } = await payload.find({
      collection: 'orders',
      where: {
        status: { equals: 'completed' },
        createdAt: {
          greater_than_equal: startDate.toISOString(),
          less_than_equal: endDate.toISOString(),
        },
      },
      limit: 0,
    })

    // Fetch processing orders
    const { docs: processingOrders } = await payload.find({
      collection: 'orders',
      where: {
        status: { equals: 'processing' },
        createdAt: {
          greater_than_equal: startDate.toISOString(),
          less_than_equal: endDate.toISOString(),
        },
      },
      limit: 0,
    })

    // Combine all orders for overall metrics
    const allOrders = [...completedOrders, ...processingOrders]

    // Fetch all transactions for conversion rate
    const { docs: transactions } = await payload.find({
      collection: 'transactions',
      where: {
        createdAt: { greater_than_equal: startDate.toISOString() },
      },
      limit: 0,
    })

    // Calculate metrics
    const totalRevenue = allOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0)
    const totalOrders = allOrders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Count unique customers (exclude guests)
    const uniqueCustomers = new Set(
      allOrders.filter((order) => order.customer).map((order) => order.customer),
    ).size

    // Calculate conversion rate
    const successfulTransactions = transactions.filter(
      (t: Transaction) => t.status === 'succeeded',
    ).length
    const totalTransactions = transactions.length
    const conversionRate =
      totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0

    // Calculate growth vs previous period
    const periodLength = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    )
    const previousStartDate = subDays(startDate, periodLength)

    const { docs: previousCompletedOrders } = await payload.find({
      collection: 'orders',
      where: {
        status: { equals: 'completed' },
        createdAt: {
          greater_than_equal: previousStartDate.toISOString(),
          less_than: startDate.toISOString(),
        },
      },
      limit: 0,
    })

    const { docs: previousProcessingOrders } = await payload.find({
      collection: 'orders',
      where: {
        status: { equals: 'processing' },
        createdAt: {
          greater_than_equal: previousStartDate.toISOString(),
          less_than: startDate.toISOString(),
        },
      },
      limit: 0,
    })

    const previousOrders = [...previousCompletedOrders, ...previousProcessingOrders]
    const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0)
    const previousOrderCount = previousOrders.length

    // Calculate growth percentages
    const revenueGrowth =
      previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0
    const orderGrowth =
      previousOrderCount > 0 ? ((totalOrders - previousOrderCount) / previousOrderCount) * 100 : 0

    const metrics: MetricsData = {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      uniqueCustomers,
      conversionRate,
      revenueGrowth,
      orderGrowth,
    }

    return Response.json(metrics)
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return Response.json({ error: 'Failed to fetch metrics' }, { status: 500 })
  }
}
