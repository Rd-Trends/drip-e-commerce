'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

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

const variantStyles = {
  info: 'bg-blue-600 text-white',
  success: 'bg-green-600 text-white',
  warning: 'bg-yellow-500 text-black',
  promo: 'bg-purple-600 text-white',
}

export function TopBannerClient({
  text,
  variant,
  isDismissible,
  link,
  showLink,
  bannerHash,
}: TopBannerClientProps) {
  const [isVisible, setIsVisible] = useState(true)
  const storageKey = `banner-dismissed-${bannerHash}`

  useEffect(() => {
    // Check if banner was previously dismissed
    if (isDismissible) {
      const dismissed = localStorage.getItem(storageKey)
      if (dismissed === 'true') {
        setIsVisible(false)
      }
    }
  }, [isDismissible, storageKey])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem(storageKey, 'true')
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className={cn('relative w-full py-3 px-4', variantStyles[variant])}>
      <div className="container mx-auto flex items-center justify-center gap-4">
        <p className="text-center text-sm font-medium flex-1">
          {text}
          {showLink && link?.url && link?.label && (
            <>
              {' '}
              <a
                href={link.url}
                target={link.newTab ? '_blank' : undefined}
                rel={link.newTab ? 'noopener noreferrer' : undefined}
                className="underline font-semibold hover:opacity-80 transition-opacity"
              >
                {link.label}
              </a>
            </>
          )}
        </p>
        {isDismissible && (
          <button
            onClick={handleDismiss}
            className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
