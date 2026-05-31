'use client'

import * as fbPixel from '@/lib/facebook-pixel'
import * as ttPixel from '@/lib/tiktok-pixel'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { createContext, useContext, useEffect, useState } from 'react'

type AnalyticsPixelContextType = {
  fbLoaded: boolean
  ttLoaded: boolean
  isAllLoaded: boolean
}

const AnalyticsPixelContext = createContext<AnalyticsPixelContextType>({
  fbLoaded: false,
  ttLoaded: false,
  isAllLoaded: false,
})

const AnalyticsPixelProvider = ({ children }: { children: React.ReactNode }) => {
  const [fbLoaded, setFbLoaded] = useState(false)
  const [ttLoaded, setTtLoaded] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (fbLoaded) fbPixel.pageview()
    if (ttLoaded) ttPixel.pageview()
  }, [pathname, fbLoaded, ttLoaded])

  return (
    <AnalyticsPixelContext.Provider
      value={{ fbLoaded, ttLoaded, isAllLoaded: fbLoaded && ttLoaded }}
    >
      {children}
      {fbPixel.FB_PIXEL_ID && (
        <Script
          id="fb-pixel"
          src="/scripts/facebook-pixel.js"
          strategy="afterInteractive"
          onLoad={() => setFbLoaded(true)}
          data-pixel-id={fbPixel.FB_PIXEL_ID}
        />
      )}
      {ttPixel.TIKTOK_PIXEL_ID && (
        <Script
          id="tiktok-pixel"
          src="/scripts/tiktok-pixel.js"
          strategy="afterInteractive"
          onLoad={() => setTtLoaded(true)}
          data-pixel-id={ttPixel.TIKTOK_PIXEL_ID}
        />
      )}
    </AnalyticsPixelContext.Provider>
  )
}

function useAnalyticsPixel() {
  return useContext(AnalyticsPixelContext)
}

export { AnalyticsPixelProvider, useAnalyticsPixel }
