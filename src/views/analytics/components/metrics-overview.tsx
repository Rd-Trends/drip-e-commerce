'use client'

import React, { useEffect, useState } from 'react'
import { DollarSign, ShoppingBag, Users, Activity } from 'lucide-react'
import { MetricCard } from './metric-card'

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
  period?: number
}

export function MetricsOverview({ period = 30 }: MetricsOverviewProps) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/api/analytics/overview?period=${period}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            cache: 'no-store',
          },
        )

        if (!response.ok) {
          throw new Error('Failed to fetch metrics')
        }

        const data = await response.json()
        setMetrics(data.metrics)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        // Set default values on error
        setMetrics({
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          uniqueCustomers: 0,
          conversionRate: 0,
          revenueGrowth: 0,
          orderGrowth: 0,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [period])

  const formatCurrency = (value: number) => {
    return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <>
      {error && (
        <div className="alert-banner" style={{ marginBottom: '1rem' }}>
          <p className="alert-text" style={{ color: 'var(--theme-error-500)' }}>
            {error}
          </p>
        </div>
      )}

      <div className="metrics-grid">
        <MetricCard
          title="Total Revenue"
          value={metrics?.totalRevenue ?? 0}
          icon={DollarSign}
          growth={metrics?.revenueGrowth}
          description="vs previous period"
          isLoading={isLoading}
          formatter={formatCurrency}
        />

        <MetricCard
          title="Total Orders"
          value={metrics?.totalOrders ?? 0}
          icon={ShoppingBag}
          growth={metrics?.orderGrowth}
          description="vs previous period"
          isLoading={isLoading}
          formatter={(value) => value.toLocaleString()}
        />

        <MetricCard
          title="Average Order Value"
          value={metrics?.averageOrderValue ?? 0}
          icon={Users}
          description="Per completed order"
          isLoading={isLoading}
          formatter={formatCurrency}
        />

        <MetricCard
          title="Conversion Rate"
          value={metrics?.conversionRate ?? 0}
          icon={Activity}
          description="Successful payments / Total attempts"
          isLoading={isLoading}
          formatter={formatPercentage}
        />
      </div>
    </>
  )
}
