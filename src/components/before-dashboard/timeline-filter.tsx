'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { subDays, format } from 'date-fns'
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

  // Draft state — local to the popup, only committed on Apply
  const [draftStart, setDraftStart] = useState<Date | undefined>(value.startDate)
  const [draftEnd, setDraftEnd] = useState<Date | undefined>(value.endDate)

  const [popupOpen, setPopupOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close on outside mousedown — but ignore clicks inside react-datepicker portals,
  // which are appended to <body> outside our wrapper's DOM subtree.
  useEffect(() => {
    if (!popupOpen) return

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (!target) return

      // Keep open if the click is inside our wrapper
      if (wrapperRef.current?.contains(target)) return

      // Keep open if the click is inside a react-datepicker portal/popper
      // (these are rendered into <body> via React portals)
      if (target.closest?.('.react-datepicker-popper, .react-datepicker__portal')) return

      setPopupOpen(false)
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [popupOpen])

  const openPopup = useCallback(() => {
    // Re-sync drafts to the last committed custom range whenever the popup opens
    setDraftStart(value.startDate)
    setDraftEnd(value.endDate)
    setPopupOpen(true)
  }, [value.startDate, value.endDate])

  const handlePeriodChange = (period: TimelinePeriod) => {
    if (period === 'custom') {
      openPopup()
      return
    }

    setSelectedPeriod(period)
    setPopupOpen(false)

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

  const handleApply = () => {
    if (!draftStart || !draftEnd) return

    onChange({ period: 'custom', startDate: draftStart, endDate: draftEnd })
    setSelectedPeriod('custom')
    setPopupOpen(false)
  }

  const hasAppliedCustomRange = selectedPeriod === 'custom' && value.startDate && value.endDate

  const customButtonLabel = hasAppliedCustomRange
    ? `${format(value.startDate!, 'MMM d, yyyy')} – ${format(value.endDate!, 'MMM d, yyyy')}`
    : 'Custom Range'

  const canApply = Boolean(draftStart && draftEnd)

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

        {/* Custom range — uses a hand-rolled popover so we can exclude
            react-datepicker's body-portalled calendar from outside-click detection */}
        <div className="timeline-filter__popup-wrapper" ref={wrapperRef}>
          <Button
            type="button"
            margin={false}
            buttonStyle={selectedPeriod === 'custom' ? 'primary' : 'secondary'}
            size="small"
            onClick={openPopup}
          >
            {customButtonLabel}
          </Button>

          {popupOpen && (
            <div className="timeline-filter__custom-popup">
              <div className="timeline-filter__date-picker">
                <label className="timeline-filter__label">Start Date</label>
                <DatePicker
                  value={draftStart}
                  onChange={(date) => setDraftStart(date as Date)}
                  displayFormat="MMM d, yyyy"
                  pickerAppearance="dayOnly"
                />
              </div>
              <div className="timeline-filter__date-picker">
                <label className="timeline-filter__label">End Date</label>
                <DatePicker
                  value={draftEnd}
                  onChange={(date) => setDraftEnd(date as Date)}
                  displayFormat="MMM d, yyyy"
                  pickerAppearance="dayOnly"
                />
              </div>
              <div className="timeline-filter__custom-popup-footer">
                <Button
                  type="button"
                  margin={false}
                  buttonStyle="primary"
                  size="small"
                  onClick={handleApply}
                  disabled={!canApply}
                >
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
