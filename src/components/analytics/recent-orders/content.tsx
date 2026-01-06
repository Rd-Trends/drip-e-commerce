import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { RecentOrdersClient } from './client'
import type { Order } from '@/payload-types'

async function fetchRecentOrders(limit: number = 10): Promise<Order[]> {
  const payload = await getPayload({ config: configPromise })

  const { docs: orders } = await payload.find({
    collection: 'orders',
    limit,
    sort: '-createdAt',
    depth: 1,
  })

  return orders
}

export async function RecentOrdersContent() {
  const orders = await fetchRecentOrders()

  return <RecentOrdersClient orders={orders} />
}
