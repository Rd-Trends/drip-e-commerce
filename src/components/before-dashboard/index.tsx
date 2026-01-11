'use client'

import React, { useState } from 'react'
import { subDays } from 'date-fns'

import './index.scss'
import '../analytics/styles.css'
import {
  MetricsOverview,
  RevenueChart,
  RecentOrders,
  TopProducts,
  LowInventory,
} from '../analytics'
import { TimelineFilter, type TimelineRange } from '../analytics/timeline-filter'
import { SeedButton } from './seed-button'

export const BeforeDashboard: React.FC = () => {
  const [timelineRange, setTimelineRange] = useState<TimelineRange>({
    period: '30d',
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  })

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h1 className="analytics-title">Analytics Dashboard</h1>
        <p className="analytics-description">Quick overview of your store performance</p>
      </div>

      {/* Timeline Filter */}
      <TimelineFilter value={timelineRange} onChange={setTimelineRange} />

      {/* Metrics Overview */}
      <MetricsOverview timelineRange={timelineRange} />

      {/* Revenue Chart */}
      <RevenueChart timelineRange={timelineRange} />

      {/* Two Column Layout */}
      <div className="analytics-grid">
        <TopProducts timelineRange={timelineRange} />
        <LowInventory />
      </div>

      {/* Recent Orders */}
      <RecentOrders timelineRange={timelineRange} />
    </div>
  )
}
