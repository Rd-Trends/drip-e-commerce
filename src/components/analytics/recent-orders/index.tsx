import React, { Suspense } from 'react'
import { RecentOrdersContent } from './content'
import { RecentOrdersLoading } from './loading'

export function RecentOrders() {
  return (
    <Suspense fallback={<RecentOrdersLoading />}>
      <RecentOrdersContent />
    </Suspense>
  )
}
