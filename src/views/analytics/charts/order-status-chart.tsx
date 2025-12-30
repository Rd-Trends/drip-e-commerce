'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface OrderStatusChartProps {
  data: {
    processing: number
    completed: number
    cancelled: number
    refunded: number
  }
}

const COLORS = {
  processing: 'var(--theme-info-500)',
  completed: 'var(--theme-success-500)',
  cancelled: 'var(--theme-error-500)',
  refunded: 'var(--theme-warning-500)',
}

const STATUS_LABELS = {
  processing: 'Processing',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

export function OrderStatusChart({ data }: OrderStatusChartProps) {
  const chartData = Object.entries(data).map(([status, count]) => ({
    name: STATUS_LABELS[status as keyof typeof STATUS_LABELS],
    value: count,
    status,
  }))

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) =>
            percent ? `${name} ${(percent * 100).toFixed(0)}%` : `${name}`
          }
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.status as keyof typeof COLORS]} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              return (
                <div className="chart-tooltip">
                  <p className="tooltip-title">{data.name}</p>
                  <p className="tooltip-text">
                    {data.value} orders ({((data.value / total) * 100).toFixed(1)}%)
                  </p>
                </div>
              )
            }
            return null
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
