import React, { Suspense } from 'react'
import { RevenueContent } from './content'
import { RevenueLoading } from './loading'

export function RevenueChart() {
  return (
    <Suspense fallback={<RevenueLoading />}>
      <RevenueContent />
    </Suspense>
  )
}
