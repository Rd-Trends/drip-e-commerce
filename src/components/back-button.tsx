'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'

export function BackButton({ ...props }: React.ComponentProps<typeof Button>) {
  const router = useRouter()
  const [canGoBack, setCanGoBack] = useState(false)

  useEffect(() => {
    // Check if there's more than one entry in the history
    // and if we didn't just land on this page from an external source
    const hasHistory = window.history.length > 1
    const hasReferrer =
      document.referrer && new URL(document.referrer).origin === window.location.origin

    setCanGoBack(Boolean(hasHistory && hasReferrer))
  }, [])

  if (!canGoBack) return null

  return <Button {...props} onClick={() => router.back()} />
}
