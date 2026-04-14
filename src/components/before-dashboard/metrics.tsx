'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { DollarSign, ShoppingBag, Users, Activity } from 'lucide-react'
import { formatCurrency } from '@/utils/format-currency'
import { queryKeys } from '@/lib/query-keys'
import { buildTimelineParams, analyticsFetcher } from './utils'
import type { TimelineRange } from './timeline-filter'

interface MetricsData {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  uniqueCustomers: number
  conversionRate: number
  revenueGrowth: number
  orderGrowth: number
}

interface MetricsOverviewProps {
  timelineRange: TimelineRange
}

export function MetricsOverview({ timelineRange }: MetricsOverviewProps) {
  const params = buildTimelineParams(timelineRange)

  const {
    data: metrics,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.analytics.metrics(params.toString()),
    queryFn: () => analyticsFetcher<MetricsData>(`/api/analytics/metrics?${params.toString()}`),
  })

  if (isLoading) {
    return <MetricsLoading />
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

  if (!metrics) {
    return null
  }

  return (
    <div className="metrics-grid">
      <MetricCard
        title="Total Revenue"
        value={metrics.totalRevenue}
        icon={DollarSign}
        growth={metrics.revenueGrowth}
        description="vs previous period"
        formatter={formatCurrency}
      />

      <MetricCard
        title="Total Orders"
        value={metrics.totalOrders}
        icon={ShoppingBag}
        growth={metrics.orderGrowth}
        description="vs previous period"
      />

      <MetricCard
        title="Average Order Value"
        value={metrics.averageOrderValue}
        icon={Activity}
        description="per order"
        formatter={formatCurrency}
      />

      <MetricCard
        title="Unique Customers"
        value={metrics.uniqueCustomers}
        icon={Users}
        description="returning customers"
      />
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: number | string
  icon: React.ElementType
  growth?: number
  description?: string
  formatter?: (value: number) => string
}

function MetricCard({ title, value, icon: Icon, growth, description, formatter }: MetricCardProps) {
  const displayValue = typeof value === 'number' && formatter ? formatter(value) : value

  return (
    <div className="metric-card">
      <div className="metric-header">
        <div className="metric-icon-wrapper">
          <Icon className="metric-icon" />
        </div>
        {growth !== undefined && (
          <div className={`metric-growth ${growth >= 0 ? 'positive' : 'negative'}`}>
            {growth >= 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="metric-content">
        <div className="metric-value">{displayValue}</div>
        <div className="metric-title">{title}</div>
        {description && <div className="metric-description">{description}</div>}
      </div>
    </div>
  )
}

function MetricsLoading() {
  return (
    <div className="metrics-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="metric-card loading">
          <div className="metric-header">
            <div className="metric-icon-wrapper skeleton" />
            <div
              className="skeleton"
              style={{ width: '60px', height: '20px', borderRadius: '4px' }}
            />
          </div>
          <div className="metric-content">
            <div className="skeleton skeleton--lg" />
            <div className="skeleton skeleton--sm" />
          </div>
        </div>
      ))}
    </div>
  )
}
