import './index.css'
import React from 'react'
import type { AdminViewServerProps } from 'payload'

import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { MetricsOverview } from './components/metrics-overview'
import { AnalyticsClient } from './analytics-client'

export default function AnalyticsDashboard({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) {
  const {
    req: { user },
  } = initPageResult

  if (!user) {
    return null
  }

  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={initPageResult.req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <Gutter>
        <div className="analytics-dashboard">
          <div className="analytics-header">
            <h1 className="analytics-title">Analytics Dashboard</h1>
            <p className="analytics-description">Quick overview of your store performance</p>
          </div>

          {/* Metrics Overview */}
          <MetricsOverview period={30} />

          {/* Interactive Charts and Data */}
          <AnalyticsClient />
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
