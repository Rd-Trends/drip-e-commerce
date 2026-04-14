'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { RevenueClient } from './client'
import { RevenueLoading } from './loading'
import { buildTimelineParams, analyticsFetcher } from '../utils'
import { queryKeys } from '@/lib/query-keys'
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
  const params = buildTimelineParams(timelineRange)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.analytics.revenue(params.toString()),
    queryFn: () =>
      analyticsFetcher<{ data: RevenueData[] }>(`/api/analytics/revenue?${params.toString()}`),
  })

  if (isLoading) {
    return <RevenueLoading />
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

  return <RevenueClient data={data?.data ?? []} />
}
