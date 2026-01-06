import React, { Suspense } from 'react'
import { LowInventoryContent } from './content'
import { LowInventoryLoading } from './loading'

export function LowInventory() {
  return (
    <Suspense fallback={<LowInventoryLoading />}>
      <LowInventoryContent />
    </Suspense>
  )
}
