'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/utils/format-currency'

interface RevenueData {
  date: string
  revenue: number
  orders: number
  averageOrderValue: number
}

interface RevenueClientProps {
  data: RevenueData[]
}

export function RevenueClient({ data }: RevenueClientProps) {
  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3 className="chart-title">Revenue Overview</h3>
        <p className="chart-description">Daily revenue and order trends</p>
      </div>
      <div className="chart-body">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-elevation-150)" />
            <XAxis dataKey="date" tick={{ fill: 'var(--theme-elevation-900)', fontSize: 12 }} />
            <YAxis
              yAxisId="left"
              tick={{ fill: 'var(--theme-elevation-900)', fontSize: 12 }}
              tickFormatter={(value) => {
                const numValue = value / Math.pow(10, 2) / 1000
                return `₦${numValue.toFixed(0)}k`
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: 'var(--theme-elevation-900)', fontSize: 12 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="chart-tooltip">
                      <p className="tooltip-date">{payload[0].payload.date}</p>
                      <div className="tooltip-content">
                        <p>
                          <span className="tooltip-label">Revenue:</span>{' '}
                          {formatCurrency(payload[0].payload.revenue)}
                        </p>
                        <p>
                          <span className="tooltip-label">Orders:</span> {payload[0].payload.orders}
                        </p>
                        <p>
                          <span className="tooltip-label">AOV:</span>{' '}
                          {formatCurrency(payload[0].payload.averageOrderValue)}
                        </p>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke="var(--theme-success-500)"
              strokeWidth={2}
              name="Revenue (₦)"
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="orders"
              stroke="var(--theme-info-500)"
              strokeWidth={2}
              name="Orders"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
