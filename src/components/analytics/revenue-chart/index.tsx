'use client'

import React, { useEffect, useState } from 'react'
import { RevenueClient } from './client'
import { RevenueLoading } from './loading'
import type { TimelineRange } from '../timeline-filter'

interface RevenueData {
  date: string
  revenue: number
  orders: number
  averageOrderValue: number
}

interface RevenueChartProps {
  timelineRange: TimelineRange
}

export function RevenueChart({ timelineRange }: RevenueChartProps) {
  const [data, setData] = useState<RevenueData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRevenue = async () => {
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

        const response = await fetch(`/api/analytics/revenue?${params.toString()}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch revenue data')
        }

        const result = await response.json()
        setData(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load revenue data')
      } finally {
        setLoading(false)
      }
    }

    fetchRevenue()
  }, [timelineRange])

  if (loading) {
    return <RevenueLoading />
  }

  if (error) {
    return (
      <div className="error-state">
        <p>Error: {error}</p>
      </div>
    )
  }

  return <RevenueClient data={data} />
}
