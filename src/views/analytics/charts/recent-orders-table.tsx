'use client'

import React from 'react'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

interface RecentOrder {
  id: string
  orderNumber: number
  total: number
  status: string
  customerEmail: string
  createdAt: string
}

interface RecentOrdersTableProps {
  orders: RecentOrder[]
}

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  if (orders.length === 0) {
    return <p className="empty-message">No recent orders</p>
  }

  return (
    <div className="table-container">
      <table className="analytics-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Status</th>
            <th className="text-right">Total</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="font-medium">{order.orderNumber}</td>
              <td>{order.customerEmail || 'Guest'}</td>
              <td>
                <span className={`status-badge status-${order.status}`}>{order.status}</span>
              </td>
              <td className="text-right font-medium">{formatCurrency(order.total)}</td>
              <td className="text-muted">{format(new Date(order.createdAt), 'MMM dd, HH:mm')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
