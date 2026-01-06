import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { LowInventoryClient } from './client'

interface InventoryItem {
  id: string
  name: string
  type: 'product' | 'variant'
  inventory: number
}

async function fetchLowInventory(threshold: number = 10): Promise<InventoryItem[]> {
  const payload = await getPayload({ config: configPromise })

  const lowInventoryItems: InventoryItem[] = []

  // Check products without variants
  const { docs: products } = await payload.find({
    collection: 'products',
    where: {
      enableVariants: { equals: false },
      inventory: { less_than_equal: threshold, greater_than: 0 },
    },
    limit: 100,
  })

  products.forEach((product) => {
    lowInventoryItems.push({
      id: String(product.id),
      name: product.title || 'Unknown Product',
      type: 'product',
      inventory: product.inventory || 0,
    })
  })

  // Check variants
  const { docs: variants } = await payload.find({
    collection: 'variants',
    where: {
      inventory: { less_than_equal: threshold, greater_than: 0 },
    },
    depth: 1,
    limit: 100,
  })

  variants.forEach((variant) => {
    const product = typeof variant.product === 'object' ? variant.product : null
    const variantName = variant.title || 'Unknown Variant'
    const productTitle = product?.title || 'Unknown Product'

    lowInventoryItems.push({
      id: String(variant.id),
      name: `${productTitle} - ${variantName}`,
      type: 'variant',
      inventory: variant.inventory || 0,
    })
  })

  // Sort by inventory ascending
  lowInventoryItems.sort((a, b) => a.inventory - b.inventory)

  return lowInventoryItems.slice(0, 20)
}

export async function LowInventoryContent() {
  const items = await fetchLowInventory()

  return <LowInventoryClient items={items} />
}
