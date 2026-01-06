'use client'

import React from 'react'
import { formatDateTime } from '@/utils/format-date-time'
import { formatCurrency } from '@/utils/format-currency'
import type { Order } from '@/payload-types'

interface RecentOrdersClientProps {
  orders: Order[]
}

export function RecentOrdersClient({ orders }: RecentOrdersClientProps) {
  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      processing: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-error',
      refunded: 'badge-warning',
    }
    return statusClasses[status] || 'badge-default'
  }

  return (
    <div className="analytics-section">
      <div className="section-header">
        <h3 className="section-title">Recent Orders</h3>
      </div>
      <div className="table-container">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <a href={`/admin/collections/orders/${order.id}`} className="table-link">
                    #{order.id}
                  </a>
                </td>
                <td>
                  {typeof order.customer === 'object' && order.customer !== null
                    ? order.customer.email
                    : 'Guest'}
                </td>
                <td>{formatCurrency(order.grandTotal || 0)}</td>
                <td>
                  <span className={`badge ${getStatusBadge(order.status || 'processing')}`}>
                    {order.status}
                  </span>
                </td>
                <td>{formatDateTime({ date: order.createdAt, format: 'MMM dd, yyyy' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
