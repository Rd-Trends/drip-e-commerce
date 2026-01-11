'use client'

import React, { useState } from 'react'
import { subDays } from 'date-fns'
import { Button, DatePicker } from '@payloadcms/ui'

export type TimelinePeriod = '24h' | '7d' | '30d' | 'custom'

export interface TimelineRange {
  period?: TimelinePeriod
  startDate?: Date
  endDate?: Date
}

interface TimelineFilterProps {
  value: TimelineRange
  onChange: (range: TimelineRange) => void
}

export const TimelineFilter: React.FC<TimelineFilterProps> = ({ value, onChange }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimelinePeriod>(value.period || '30d')
  const [showCustomPicker, setShowCustomPicker] = useState(false)

  const handlePeriodChange = (period: TimelinePeriod) => {
    setSelectedPeriod(period)

    if (period === 'custom') {
      setShowCustomPicker(true)
      // Don't call onChange yet, wait for date selection
    } else {
      setShowCustomPicker(false)

      const endDate = new Date()
      let startDate: Date

      switch (period) {
        case '24h':
          startDate = subDays(endDate, 1)
          break
        case '7d':
          startDate = subDays(endDate, 7)
          break
        case '30d':
          startDate = subDays(endDate, 30)
          break
        default:
          startDate = subDays(endDate, 30)
      }

      onChange({ period, startDate, endDate })
    }
  }

  const handleCustomDateChange = (field: 'startDate' | 'endDate', date: Date) => {
    const newRange = {
      period: 'custom' as TimelinePeriod,
      startDate: field === 'startDate' ? date : value.startDate,
      endDate: field === 'endDate' ? date : value.endDate,
    }

    // Only emit change if both dates are set
    if (newRange.startDate && newRange.endDate) {
      onChange(newRange)
    }
  }

  return (
    <div className="timeline-filter">
      <div className="timeline-filter__buttons">
        <Button
          type="button"
          margin={false}
          buttonStyle={selectedPeriod === '24h' ? 'primary' : 'secondary'}
          size="small"
          onClick={() => handlePeriodChange('24h')}
        >
          Last 24 Hours
        </Button>
        <Button
          type="button"
          margin={false}
          buttonStyle={selectedPeriod === '7d' ? 'primary' : 'secondary'}
          size="small"
          onClick={() => handlePeriodChange('7d')}
        >
          Last 7 Days
        </Button>
        <Button
          type="button"
          margin={false}
          buttonStyle={selectedPeriod === '30d' ? 'primary' : 'secondary'}
          size="small"
          onClick={() => handlePeriodChange('30d')}
        >
          Last 30 Days
        </Button>
        <Button
          type="button"
          margin={false}
          buttonStyle={selectedPeriod === 'custom' ? 'primary' : 'secondary'}
          size="small"
          onClick={() => handlePeriodChange('custom')}
        >
          Custom Range
        </Button>
      </div>

      {showCustomPicker && (
        <div className="timeline-filter__custom">
          <div className="timeline-filter__date-picker">
            <label className="timeline-filter__label">Start Date</label>
            <DatePicker
              value={value.startDate}
              onChange={(date) => handleCustomDateChange('startDate', date as Date)}
              displayFormat="dd MMM yyyy"
              pickerAppearance="dayAndTime"
            />
          </div>
          <div className="timeline-filter__date-picker">
            <label className="timeline-filter__label">End Date</label>
            <DatePicker
              value={value.endDate}
              onChange={(date) => handleCustomDateChange('endDate', date as Date)}
              displayFormat="dd MMM yyyy"
              pickerAppearance="dayAndTime"
            />
          </div>
        </div>
      )}
    </div>
  )
}
