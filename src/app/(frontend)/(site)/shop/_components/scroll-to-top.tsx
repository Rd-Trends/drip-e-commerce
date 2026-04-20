'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

export function ScrollToTop() {
  const searchParams = useSearchParams()
  const params = searchParams.toString()
  const didMount = useRef(false)

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      return
    }

    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [params])

  return null
}
