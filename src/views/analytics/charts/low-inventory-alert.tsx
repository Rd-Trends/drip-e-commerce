'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface InventoryItem {
  id: string
  name: string
  type: string
  inventory: number
}

interface LowInventoryAlertProps {
  items: InventoryItem[]
}

export function LowInventoryAlert({ items }: LowInventoryAlertProps) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p>All products have sufficient inventory</p>
      </div>
    )
  }

  return (
    <div className="inventory-alert">
      <div className="alert-banner">
        <AlertTriangle className="alert-icon" size={16} />
        <p className="alert-text">
          {items.length} item{items.length !== 1 ? 's' : ''} running low on stock
        </p>
      </div>

      <table className="analytics-table">
        <thead>
          <tr>
            <th>Product / Variant</th>
            <th>Type</th>
            <th className="text-right">Stock Level</th>
            <th className="text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className="font-medium">{item.name}</td>
              <td>
                <span className="type-badge">{item.type}</span>
              </td>
              <td className="text-right font-medium">
                <span
                  className={
                    item.inventory === 0
                      ? 'stock-critical'
                      : item.inventory <= 5
                        ? 'stock-low'
                        : 'stock-warning'
                  }
                >
                  {item.inventory}
                </span>
              </td>
              <td className="text-right">
                {item.inventory === 0 ? (
                  <span className="status-badge status-error">Out of Stock</span>
                ) : item.inventory <= 5 ? (
                  <span className="status-badge status-critical">Critical</span>
                ) : (
                  <span className="status-badge status-warning">Low</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
