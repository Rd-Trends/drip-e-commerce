'use client'

import { Button } from '@/components/ui/button'
import type { Product, VariantOption } from '@/payload-types'

import { createUrl } from '@/utils/create-url'
import { cn } from '@/lib/utils'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React from 'react'
import Link from 'next/link'

export function VariantSelector({ product }: { product: Product }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const variants = product.variants?.docs
  const variantTypes = product.variantTypes
  const hasVariants = Boolean(product.enableVariants && variants?.length && variantTypes?.length)

  if (!hasVariants) {
    return null
  }

  return (
    <div className="space-y-6">
      {variantTypes?.map((type) => {
        if (!type || typeof type !== 'object') {
          return <React.Fragment key="empty" />
        }

        const options = type.options?.docs

        if (!options || !Array.isArray(options) || !options.length) {
          return <React.Fragment key={type.id} />
        }

        const isColorType = type.name.toLowerCase().includes('color')
        const isSizeType = type.name.toLowerCase().includes('size')

        return (
          <div key={type.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium">{type.label}</h3>
              {isSizeType && (
                <Link href="#sizing" className="text-sm text-primary hover:underline font-medium">
                  See sizing chart
                </Link>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {options?.map((option) => {
                if (!option || typeof option !== 'object') {
                  return <React.Fragment key="empty" />
                }

                const optionID = option.id
                const optionKeyLowerCase = type.name

                // Base option params on current params so we can preserve any other param state in the url.
                const optionSearchParams = new URLSearchParams(searchParams.toString())

                // Remove image and variant ID from this search params so we can loop over it safely.
                optionSearchParams.delete('variant')
                optionSearchParams.delete('image')

                // Update the option params using the current option to reflect how the url *would* change,
                // if the option was clicked.
                optionSearchParams.set(optionKeyLowerCase, String(optionID))

                const currentOptions = Array.from(optionSearchParams.values())

                let isAvailableForSale = true

                // Find a matching variant
                if (variants) {
                  const matchingVariant = variants
                    .filter((variant) => typeof variant === 'object')
                    .find((variant) => {
                      if (!variant.options || !Array.isArray(variant.options)) return false

                      // Check if all variant options match the current options in the URL
                      return variant.options.every((variantOption) => {
                        if (typeof variantOption !== 'object')
                          return currentOptions.includes(String(variantOption))

                        return currentOptions.includes(String(variantOption.id))
                      })
                    })

                  if (matchingVariant) {
                    // If we found a matching variant, set the variant ID in the search params.
                    optionSearchParams.set('variant', String(matchingVariant.id))

                    if (matchingVariant.inventory && matchingVariant.inventory > 0) {
                      isAvailableForSale = true
                    } else {
                      isAvailableForSale = false
                    }
                  }
                }

                const optionUrl = createUrl(pathname, optionSearchParams)

                // The option is active if it's in the url params.
                const isActive =
                  Boolean(isAvailableForSale) &&
                  searchParams.get(optionKeyLowerCase) === String(optionID)

                // Color variant - circular swatch
                if (isColorType) {
                  return (
                    <ColorVariantButton
                      key={option.id}
                      isActive={isActive}
                      isAvailableForSale={isAvailableForSale}
                      optionUrl={optionUrl}
                      option={option}
                    />
                  )
                }

                // Size or other variants - button style
                return (
                  <Button
                    key={option.id}
                    variant={isActive ? 'default' : 'outline'}
                    size="lg"
                    aria-disabled={!isAvailableForSale}
                    disabled={!isAvailableForSale}
                    onClick={() => {
                      router.replace(`${optionUrl}`, {
                        scroll: false,
                      })
                    }}
                    title={`${option.label} ${!isAvailableForSale ? ' (Out of Stock)' : ''}`}
                    className={cn('min-w-[4rem] font-medium', {
                      'opacity-40': !isAvailableForSale,
                    })}
                  >
                    {option.label}
                  </Button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Helper function to map color names to hex values
function getColorValue(value: string): string {
  const colorMap: Record<string, string> = {
    black: '#000000',
    white: '#FFFFFF',
    gray: '#6B7280',
    grey: '#6B7280',
    red: '#EF4444',
    blue: '#3B82F6',
    green: '#10B981',
    yellow: '#F59E0B',
    purple: '#8B5CF6',
    pink: '#EC4899',
    indigo: '#6366F1',
    navy: '#1E3A8A',
    brown: '#92400E',
    beige: '#F5F5DC',
    orange: '#F97316',
    teal: '#14B8A6',
  }

  const normalized = value.toLowerCase().trim()
  return colorMap[normalized] || value // Default to gray if color not found
}

const ColorVariantButton = ({
  isActive,
  isAvailableForSale,
  optionUrl,
  option,
}: {
  isActive: boolean
  isAvailableForSale: boolean
  optionUrl: string
  option: VariantOption
}) => {
  const [isHovered, setIsHovered] = React.useState(false)
  const router = useRouter()
  const colorValue = getColorValue(option.value)

  return (
    <button
      key={option.id}
      aria-label={`Select ${option.label}`}
      aria-disabled={!isAvailableForSale}
      disabled={!isAvailableForSale}
      onClick={() => {
        router.replace(`${optionUrl}`, {
          scroll: false,
        })
      }}
      title={`${option.label} ${!isAvailableForSale ? ' (Out of Stock)' : ''}`}
      className={cn('relative h-10 w-10 rounded-full border-2 transition-all', {})}
      style={{
        borderColor: isActive || isHovered ? colorValue : 'transparent',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="absolute inset-1 rounded-full" style={{ backgroundColor: colorValue }} />
    </button>
  )
}
