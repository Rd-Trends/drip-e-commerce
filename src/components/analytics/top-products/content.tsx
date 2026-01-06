import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { subDays } from 'date-fns'
import { TopProductsClient } from './client'

interface ProductData {
  id: string
  title: string
  revenue: number
  quantity: number
}

async function fetchTopProducts(period: number = 30, limit: number = 10): Promise<ProductData[]> {
  const payload = await getPayload({ config: configPromise })

  const startDate = subDays(new Date(), period)

  // Fetch completed orders
  const { docs: orders } = await payload.find({
    collection: 'orders',
    where: {
      status: { equals: 'completed' },
      createdAt: { greater_than_equal: startDate.toISOString() },
    },
    limit: 10000,
    depth: 2,
  })

  // Aggregate product sales
  const productMap = new Map<string, ProductData>()

  orders.forEach((order) => {
    order.items?.forEach((item: any) => {
      const product = item.product
      if (typeof product === 'object' && product !== null) {
        const productId = product.id
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

  // Sort by revenue and take top N
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)

  return topProducts
}

export async function TopProductsContent() {
  const products = await fetchTopProducts()

  return <TopProductsClient products={products} />
}
