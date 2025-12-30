'use client'

import React from 'react'
import { formatCurrency } from '@/lib/utils'

interface Product {
  id: string
  title: string
  revenue: number
  quantity: number
}

interface TopProductsTableProps {
  products: Product[]
}

export function TopProductsTable({ products }: TopProductsTableProps) {
  if (products.length === 0) {
    return <p className="empty-message">No product data available</p>
  }

  return (
    <table className="analytics-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Product</th>
          <th className="text-right">Quantity Sold</th>
          <th className="text-right">Revenue</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product, index) => (
          <tr key={product.id}>
            <td className="font-medium">#{index + 1}</td>
            <td>{product.title}</td>
            <td className="text-right">{product.quantity}</td>
            <td className="text-right font-medium">{formatCurrency(product.revenue)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
