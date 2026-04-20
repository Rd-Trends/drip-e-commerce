'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface TopBannerClientProps {
  text: string
  variant: 'info' | 'success' | 'warning' | 'promo'
  isDismissible: boolean
  link?: {
    label?: string
    url?: string
    newTab?: boolean
  } | null
  showLink?: boolean
  bannerHash: string // Hash of banner content to track if banner changed
}

export function TopBannerClient({
  text,
  variant,
  isDismissible,
  link,
  showLink,
  bannerHash,
}: TopBannerClientProps) {
  const bannerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(!isDismissible)
  const storageKey = `banner-dismissed-${bannerHash}`

  useEffect(() => {
    // Check if banner was previously dismissed
    if (isDismissible) {
      const dismissed = localStorage.getItem(storageKey)
      if (dismissed === 'true') {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
    } else {
      setIsVisible(true)
    }
  }, [isDismissible, storageKey])

  useEffect(() => {
    if (!isVisible) {
      document.documentElement.style.setProperty('--banner-height', '0px')
      return
    }

    const banner = bannerRef.current

    if (!banner) {
      return
    }

    let frameId = 0

    const updateBannerHeight = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0
        document.documentElement.style.setProperty('--banner-height', `${banner.offsetHeight}px`)
      })
    }

    updateBannerHeight()

    const resizeObserver = new ResizeObserver(updateBannerHeight)
    resizeObserver.observe(banner)

    window.addEventListener('resize', updateBannerHeight)
    window.visualViewport?.addEventListener('resize', updateBannerHeight)

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }

      resizeObserver.disconnect()
      window.removeEventListener('resize', updateBannerHeight)
      window.visualViewport?.removeEventListener('resize', updateBannerHeight)
      document.documentElement.style.setProperty('--banner-height', '0px')
    }
  }, [isVisible])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem(storageKey, 'true')
  }

  if (!isVisible) {
    return null
  }

  return (
    <div
      ref={bannerRef}
      className={cn('sticky top-0 z-50 w-full py-3 px-4', {
        'bg-blue-50 text-blue-900 border-b border-blue-200': variant === 'info',
        'bg-green-50 text-green-900 border-b border-green-200': variant === 'success',
        'bg-amber-50 text-amber-900 border-b border-amber-200': variant === 'warning',
        'bg-primary/10 text-primary border-b border-primary/20': variant === 'promo',
      })}
    >
      <div className="container mx-auto flex items-center justify-center gap-4">
        <p className="text-center text-sm font-medium flex-1">
          {text}
          {showLink && link?.url && link?.label && (
            <>
              {' '}
              <Link
                href={link.url}
                target={link.newTab ? '_blank' : undefined}
                rel={link.newTab ? 'noopener noreferrer' : undefined}
                className={cn('underline font-semibold hover:opacity-80 transition-opacity', {
                  'text-blue-700 hover:text-blue-800': variant === 'info',
                  'text-green-700 hover:text-green-800': variant === 'success',
                  'text-amber-700 hover:text-amber-800': variant === 'warning',
                  'text-primary hover:text-primary/80': variant === 'promo',
                })}
              >
                {link.label}
              </Link>
            </>
          )}
        </p>
        {isDismissible && (
          <button
            onClick={handleDismiss}
            className={cn(
              'absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity',
              {
                'text-blue-700 hover:text-blue-900': variant === 'info',
                'text-green-700 hover:text-green-900': variant === 'success',
                'text-amber-700 hover:text-amber-900': variant === 'warning',
                'text-primary hover:text-primary/80': variant === 'promo',
              },
            )}
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
