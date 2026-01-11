'use client'

import React from 'react'
import { DollarSign, ShoppingBag, Users, Activity } from 'lucide-react'
import { formatCurrency } from '@/utils/format-currency'

interface MetricsData {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  uniqueCustomers: number
  conversionRate: number
  revenueGrowth: number
  orderGrowth: number
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

interface MetricsClientProps {
  metrics: MetricsData
}

export function MetricsClient({ metrics }: MetricsClientProps) {
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
