'use client'

import React from 'react'
import { formatCurrency } from '@/utils/format-currency'

interface ProductData {
  id: string
  title: string
  revenue: number
  quantity: number
}

interface TopProductsClientProps {
  products: ProductData[]
}

export function TopProductsClient({ products }: TopProductsClientProps) {
  return (
    <div className="analytics-section">
      <div className="section-header">
        <h3 className="section-title">Top Selling Products</h3>
      </div>
      <div className="table-container">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Product</th>
              <th>Units Sold</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={product.id}>
                <td>{index + 1}</td>
                <td>
                  <a href={`/admin/collections/products/${product.id}`} className="table-link">
                    {product.title}
                  </a>
                </td>
                <td>{product.quantity}</td>
                <td>{formatCurrency(product.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
