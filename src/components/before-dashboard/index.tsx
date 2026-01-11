import React from 'react'

import './index.scss'
import '../analytics/styles.css'
import {
  MetricsOverview,
  RevenueChart,
  RecentOrders,
  TopProducts,
  LowInventory,
} from '../analytics'
import { SeedButton } from './seed-button'

export const BeforeDashboard: React.FC = () => {
  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h1 className="analytics-title">Analytics Dashboard</h1>
        <p className="analytics-description">
          Quick overview of your store performance over the last 30 days
        </p>
      </div>

      <SeedButton />

      {/* Metrics Overview */}
      <MetricsOverview />

      {/* Revenue Chart */}
      <RevenueChart />

      {/* Two Column Layout */}
      <div className="analytics-grid">
        <TopProducts />
        <LowInventory />
      </div>

      {/* Recent Orders */}
      <RecentOrders />
    </div>
  )
}
