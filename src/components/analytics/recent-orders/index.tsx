'use client'

import React, { useEffect, useState } from 'react'
import { formatDateTime } from '@/utils/format-date-time'
import { formatCurrency } from '@/utils/format-currency'
import type { Order } from '@/payload-types'
import type { TimelineRange } from '../timeline-filter'

interface RecentOrdersProps {
  timelineRange: TimelineRange
}

const getStatusBadge = (status: NonNullable<Order['status']>) => {
  const statusClasses: Record<NonNullable<Order['status']>, string> = {
    processing: 'badge-info',
    shipped: 'badge-info',
    completed: 'badge-success',
    cancelled: 'badge-error',
    refunded: 'badge-warning',
  }
  return statusClasses[status] || 'badge-default'
}

export function RecentOrders({ timelineRange }: RecentOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecentOrders = async () => {
      setLoading(true)
      setError(null)

      try {
        // Build query params
        const params = new URLSearchParams()

        if (timelineRange.period && timelineRange.period !== 'custom') {
          const periodMap = { '24h': '1', '7d': '7', '30d': '30' }
          params.append('period', periodMap[timelineRange.period] || '30')
        } else if (timelineRange.startDate && timelineRange.endDate) {
          params.append('startDate', timelineRange.startDate.toISOString())
          params.append('endDate', timelineRange.endDate.toISOString())
        }

        params.append('limit', '10')

        const response = await fetch(`/api/analytics/recent-orders?${params.toString()}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch recent orders')
        }

        const result = await response.json()
        setOrders(result.docs)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recent orders')
      } finally {
        setLoading(false)
      }
    }

    fetchRecentOrders()
  }, [timelineRange])

  if (loading) {
    return <RecentOrdersLoading />
  }

  if (error) {
    return (
      <div className="error-state">
        <p>Error: {error}</p>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="analytics-section">
        <div className="analytics-section-header">
          <h3 className="analytics-section-title">Recent Orders</h3>
        </div>
        <div className="empty-state">
          <p>No orders found for this period</p>
        </div>
      </div>
    )
  }

  return (
    <div className="analytics-section">
      <div className="analytics-section-header">
        <h3 className="analytics-section-title">Recent Orders</h3>
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
                    : `Guest (${order.customerEmail || 'No Email'})`}
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

export function RecentOrdersLoading() {
  return (
    <div className="analytics-section">
      <div className="section-header">
        <div className="skeleton" style={{ width: '180px', height: '24px' }} />
      </div>
      <div className="table-container">
        <div className="skeleton" style={{ width: '100%', height: '400px' }} />
      </div>
    </div>
  )
}
