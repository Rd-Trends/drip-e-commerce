'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  growth?: number
  isLoading?: boolean
  formatter?: (value: number) => string
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  growth,
  isLoading = false,
  formatter,
}: MetricCardProps) {
  if (isLoading) {
    return (
      <div className="metric-card">
        <div className="metric-card-header">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-6 rounded" />
        </div>
        <div className="metric-card-content">
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    )
  }

  const displayValue = typeof value === 'number' && formatter ? formatter(value) : value

  return (
    <div className="metric-card">
      <div className="metric-card-header">
        <h3 className="metric-card-title">{title}</h3>
        <Icon className="metric-icon" />
      </div>
      <div className="metric-card-content">
        <div className="metric-value">{displayValue}</div>
        {(description || growth !== undefined) && (
          <p className="metric-description">
            {growth !== undefined && (
              <>
                <span className={growth >= 0 ? 'metric-growth-positive' : 'metric-growth-negative'}>
                  {growth >= 0 ? '↑' : '↓'} {growth >= 0 ? '+' : ''}
                  {growth.toFixed(1)}%
                </span>
                {description && <span> {description}</span>}
              </>
            )}
            {growth === undefined && description}
          </p>
        )}
      </div>
    </div>
  )
}
