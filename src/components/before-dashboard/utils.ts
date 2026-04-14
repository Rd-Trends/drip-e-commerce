import type { TimelineRange } from './timeline-filter'

/**
 * Build URLSearchParams from a TimelineRange for analytics API calls.
 * Centralises the period-mapping logic that was previously duplicated
 * across every analytics component.
 */
export function buildTimelineParams(timelineRange: TimelineRange): URLSearchParams {
  const params = new URLSearchParams()

  if (timelineRange.period && timelineRange.period !== 'custom') {
    const periodMap: Record<string, string> = { '24h': '1', '7d': '7', '30d': '30' }
    params.append('period', periodMap[timelineRange.period] || '30')
  } else if (timelineRange.startDate && timelineRange.endDate) {
    params.append('startDate', timelineRange.startDate.toISOString())
    params.append('endDate', timelineRange.endDate.toISOString())
  } else {
    params.append('period', '30')
  }

  return params
}

/**
 * Generic fetcher for analytics endpoints.
 * Throws on non-ok responses so react-query surfaces the error automatically.
 */
export async function analyticsFetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' })

  if (!response.ok) {
    throw new Error(`Analytics request failed: ${response.statusText}`)
  }

  return response.json() as Promise<T>
}
