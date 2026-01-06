import React, { Suspense } from 'react'
import { TopProductsContent } from './content'
import { TopProductsLoading } from './loading'

export function TopProducts() {
  return (
    <Suspense fallback={<TopProductsLoading />}>
      <TopProductsContent />
    </Suspense>
  )
}
