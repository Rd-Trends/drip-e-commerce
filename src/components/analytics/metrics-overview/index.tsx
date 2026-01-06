import React, { Suspense } from 'react'
import { MetricsContent } from './content'
import { MetricsLoading } from './loading'

export function MetricsOverview() {
  return (
    <Suspense fallback={<MetricsLoading />}>
      <MetricsContent />
    </Suspense>
  )
}
