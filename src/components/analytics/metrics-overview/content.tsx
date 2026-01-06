import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { subDays } from 'date-fns'
import { MetricsClient } from './client'

interface MetricsData {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  uniqueCustomers: number
  conversionRate: number
  revenueGrowth: number
  orderGrowth: number
}

async function fetchMetrics(period: number = 30): Promise<MetricsData> {
  const payload = await getPayload({ config: configPromise })

  // Calculate date range
  const endDate = new Date()
  const startDate = subDays(endDate, period)

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

  // Calculate metrics
  const totalRevenue = allOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0)
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
  const previousStartDate = subDays(startDate, period)

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

  const previousOrders = [...previousCompletedOrders, ...previousProcessingOrders]
  const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0)
  const previousOrderCount = previousOrders.length

  // Calculate growth percentages
  const revenueGrowth =
    previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0
  const orderGrowth =
    previousOrderCount > 0 ? ((totalOrders - previousOrderCount) / previousOrderCount) * 100 : 0

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    uniqueCustomers,
    conversionRate,
    revenueGrowth,
    orderGrowth,
  }
}

export async function MetricsContent() {
  const metrics = await fetchMetrics()

  return <MetricsClient metrics={metrics} />
}
