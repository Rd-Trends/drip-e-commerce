'use client'

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { subDays } from 'date-fns'

import './styles.css'
import { TimelineFilter, type TimelineRange } from './timeline-filter'
import { MetricsOverview } from './metrics'
import { RevenueChart } from './revenue-chart'
import { RecentOrders } from './recent-orders'
import { TopProducts } from './top-products'
import { LowInventory } from './low-inventory'
import { SeedButton } from './seed-button'

export type DashboardPermissions = {
  showMetrics: boolean
  showRevenue: boolean
  showRecentOrders: boolean
  showTopProducts: boolean
  showLowInventory: boolean
}

interface BeforeDashboardClientProps {
  permissions: DashboardPermissions
}

export const BeforeDashboardClient: React.FC<BeforeDashboardClientProps> = ({ permissions }) => {
  const { showMetrics, showRevenue, showRecentOrders, showTopProducts, showLowInventory } =
    permissions

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  const [timelineRange, setTimelineRange] = useState<TimelineRange>({
    period: '30d',
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  })

  // Timeline filter is only useful when at least one timeline-aware section is visible
  const showTimelineFilter = showMetrics || showRevenue || showRecentOrders || showTopProducts

  return (
    <QueryClientProvider client={queryClient}>
      <div className="analytics-dashboard">
        <div className="analytics-header">
          <h1 className="analytics-title">Analytics Dashboard</h1>
          <p className="analytics-description">Quick overview of your store performance</p>
        </div>

        {/* Timeline Filter */}
        {showTimelineFilter && <TimelineFilter value={timelineRange} onChange={setTimelineRange} />}

        {/* Metrics Overview */}
        {showMetrics && <MetricsOverview timelineRange={timelineRange} />}

        {/* Revenue Chart */}
        {showRevenue && <RevenueChart timelineRange={timelineRange} />}

        {showRecentOrders && <RecentOrders timelineRange={timelineRange} />}

        {showTopProducts && <TopProducts timelineRange={timelineRange} />}

        {showLowInventory && <LowInventory />}
      </div>
    </QueryClientProvider>
  )
}
