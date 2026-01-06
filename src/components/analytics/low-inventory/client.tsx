'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface InventoryItem {
  id: string
  name: string
  type: 'product' | 'variant'
  inventory: number
}

interface LowInventoryClientProps {
  items: InventoryItem[]
}

export function LowInventoryClient({ items }: LowInventoryClientProps) {
  if (items.length === 0) {
    return (
      <div className="analytics-section">
        <div className="section-header">
          <h3 className="section-title">Low Inventory Alerts</h3>
        </div>
        <div className="empty-state">
          <p>All products have healthy inventory levels!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="analytics-section">
      <div className="section-header">
        <h3 className="section-title">
          <AlertTriangle className="icon-warning" size={20} />
          Low Inventory Alerts
        </h3>
      </div>
      <div className="table-container">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Product/Variant</th>
              <th>Type</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <a
                    href={`/admin/collections/${item.type === 'product' ? 'products' : 'variants'}/${item.id}`}
                    className="table-link"
                  >
                    {item.name}
                  </a>
                </td>
                <td>
                  <span className="badge badge-default">{item.type}</span>
                </td>
                <td>
                  <span
                    className={`badge ${item.inventory <= 5 ? 'badge-error' : 'badge-warning'}`}
                  >
                    {item.inventory} units
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
