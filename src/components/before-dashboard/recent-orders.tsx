'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { formatDateTime } from '@/utils/format-date-time'
import { formatCurrency } from '@/utils/format-currency'
import { queryKeys } from '@/lib/query-keys'
import type { Order } from '@/payload-types'
import type { TimelineRange } from './timeline-filter'
import { buildTimelineParams, analyticsFetcher } from './utils'

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
  const params = buildTimelineParams(timelineRange)
  params.append('limit', '10')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.analytics.recentOrders(params.toString()),
    queryFn: () =>
      analyticsFetcher<{ docs: Order[] }>(`/api/analytics/recent-orders?${params.toString()}`),
  })

  const orders = data?.docs ?? []

  if (isLoading) {
    return <RecentOrdersLoading />
  }

  if (error) {
    return (
      <div className="error-state">
        <p>Error: {error.message}</p>
        <button className="error-state__retry" onClick={() => refetch()}>
          Retry
        </button>
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
      <div className="analytics-section-header">
        <div className="skeleton skeleton--md" />
      </div>
      <div className="table-container">
        <div className="skeleton skeleton--full" />
      </div>
    </div>
  )
}
