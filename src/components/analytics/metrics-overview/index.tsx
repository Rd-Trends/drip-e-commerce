'use client'

import React, { useEffect, useState } from 'react'
import { DollarSign, ShoppingBag, Users, Activity } from 'lucide-react'
import { formatCurrency } from '@/utils/format-currency'
import type { TimelineRange } from '../timeline-filter'

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
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
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
        } else {
          params.append('period', '30')
        }

        const response = await fetch(`/api/analytics/metrics?${params.toString()}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch metrics')
        }

        const data = await response.json()
        setMetrics(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [timelineRange])

  if (loading) {
    return <MetricsLoading />
  }

  if (error) {
    return (
      <div className="error-state">
        <p>Error: {error}</p>
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
            <div className="metric-growth skeleton" style={{ width: '60px', height: '20px' }} />
          </div>
          <div className="metric-content">
            <div
              className="skeleton"
              style={{ width: '120px', height: '36px', marginBottom: '8px' }}
            />
            <div className="skeleton" style={{ width: '80px', height: '16px' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
