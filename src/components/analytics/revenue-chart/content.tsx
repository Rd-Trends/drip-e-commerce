import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { subDays, format, eachDayOfInterval } from 'date-fns'
import { RevenueClient } from './client'

interface RevenueData {
  date: string
  revenue: number
  orders: number
  averageOrderValue: number
}

async function fetchRevenueData(period: number = 30): Promise<RevenueData[]> {
  const payload = await getPayload({ config: configPromise })

  const endDate = new Date()
  const startDate = subDays(endDate, period)

  // Fetch completed orders
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
  const intervals = eachDayOfInterval({ start: startDate, end: endDate })

  // Group orders by day
  const revenueData = intervals.map((date) => {
    const dateStr = format(date, 'MMM dd')

    const dayOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt)
      return format(orderDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    })

    const revenue = dayOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0)
    const orderCount = dayOrders.length

    return {
      date: dateStr,
      revenue,
      orders: orderCount,
      averageOrderValue: orderCount > 0 ? revenue / orderCount : 0,
    }
  })

  return revenueData
}

export async function RevenueContent() {
  const data = await fetchRevenueData()

  return <RevenueClient data={data} />
}
