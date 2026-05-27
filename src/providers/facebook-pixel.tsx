'use client'

import * as pixel from '@/lib/facebook-pixel'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { createContext, useContext, useEffect, useState } from 'react'

type FacebookPixelContextType = {
  isLoaded: boolean
}

const FacebookPixelContext = createContext<FacebookPixelContextType>({ isLoaded: false })

const FacebookPixelProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoaded) return
    pixel.pageview()
  }, [pathname, isLoaded])

  return (
    <FacebookPixelContext.Provider value={{ isLoaded }}>
      {children}
      {pixel.FB_PIXEL_ID && (
        <>
          <Script
            id="fb-pixel"
            src="/scripts/pixel.js"
            strategy="afterInteractive"
            onLoad={() => setIsLoaded(true)}
            data-pixel-id={pixel.FB_PIXEL_ID}
          />
        </>
      )}
    </FacebookPixelContext.Provider>
  )
}

function useFacebookPixel() {
  return useContext(FacebookPixelContext)
}

export { FacebookPixelProvider, useFacebookPixel }
