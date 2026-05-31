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
  }, [pathname, fbLoaded])

  useEffect(() => {
    if (ttLoaded) ttPixel.pageview()
  }, [pathname, ttLoaded])

  return (
    <AnalyticsPixelContext.Provider
      value={{
        fbLoaded,
        ttLoaded,
        // True when every *configured* pixel has finished loading.
        // If a pixel ID is not set, that pixel is considered already "loaded" (skipped).
        isAllLoaded: (fbLoaded || !fbPixel.FB_PIXEL_ID) && (ttLoaded || !ttPixel.TIKTOK_PIXEL_ID),
      }}
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
          dangerouslySetInnerHTML={{
            __html: `!function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
          var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
          ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};


            ttq.load('${ttPixel.TIKTOK_PIXEL_ID}');
          }(window, document, 'ttq');`,
          }}
        />
      )}
    </AnalyticsPixelContext.Provider>
  )
}

function useAnalyticsPixel() {
  return useContext(AnalyticsPixelContext)
}

export { AnalyticsPixelProvider, useAnalyticsPixel }
