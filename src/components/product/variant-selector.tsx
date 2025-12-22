'use client'

import { Button } from '@/components/ui/button'
import type { Product, VariantOption, VariantType } from '@/payload-types'
import { isOptionAvailable, findMatchingVariant, getColorValue } from '@/utils/variant-helpers'
import { cn } from '@/lib/utils'
import { parseAsInteger, useQueryStates } from 'nuqs'
import React, { useMemo } from 'react'
import Link from 'next/link'

export function VariantSelector({ product }: { product: Product }) {
  const variants = product.variants?.docs
  const variantTypes = product.variantTypes
  const hasVariants = Boolean(product.enableVariants && variants?.length && variantTypes?.length)

  if (!hasVariants || !variantTypes) {
    return null
  }

  return <VariantOptions product={product} variantTypes={variantTypes} />
}

function VariantOptions({
  product,
  variantTypes,
}: {
  product: Product
  variantTypes: (VariantType | number)[]
}) {
  // Create dynamic parser config for all variant types
  const parserConfig = useMemo(() => {
    const config: Record<string, ReturnType<typeof parseAsInteger.withDefault>> = {}
    variantTypes.forEach((type) => {
      if (type && typeof type === 'object') {
        config[type.name] = parseAsInteger.withDefault(0)
      }
    })

    config.variant = parseAsInteger.withDefault(0)
    return config
  }, [variantTypes])

  const [params, setParams] = useQueryStates(parserConfig, {
    history: 'replace',
  })

  // Build selected options map from params (keyed by variant type ID)
  const selectedOptions = useMemo(() => {
    const selections: Record<number, number> = {}
    variantTypes.forEach((type) => {
      if (!type || typeof type !== 'object') return
      const paramValue = params[type.name]
      if (paramValue && paramValue !== 0) {
        selections[type.id] = paramValue
      }
    })
    return selections
  }, [params, variantTypes])

  const handleOptionSelect = (typeName: string, typeId: number, optionId: number) => {
    // Build test selections with the new option
    const testSelections: Record<number, number> = { ...selectedOptions, [typeId]: optionId }

    // Find matching variant for these selections
    const matchingVariant = findMatchingVariant(
      product.variants,
      testSelections,
      variantTypes.length,
    )

    // Only set variant ID if the matching variant has inventory
    const hasInventory =
      matchingVariant && matchingVariant.inventory && matchingVariant.inventory > 0

    // Update params: set the option and variant (only if has inventory)
    const updates: Record<string, number | null> = {
      [typeName]: optionId,
      variant: hasInventory ? matchingVariant.id : null,
    }

    setParams(updates)
  }

  return (
    <div className="space-y-6">
      {variantTypes.map((type) => {
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
              {options.map((option) => {
                if (!option || typeof option !== 'object') {
                  return <React.Fragment key="empty" />
                }

                // Check if this option is available based on current selections
                const isAvailableForSale = isOptionAvailable(
                  product.variants,
                  type.id,
                  option.id,
                  selectedOptions,
                )

                // The option is active if it matches current param
                const isActive = params[type.name] === option.id

                // Color variant - circular swatch
                if (isColorType) {
                  return (
                    <ColorVariantButton
                      key={option.id}
                      isActive={isActive}
                      isAvailableForSale={isAvailableForSale}
                      onSelect={() => handleOptionSelect(type.name, type.id, option.id)}
                      option={option}
                    />
                  )
                }

                // Size or other variants - button style
                return (
                  <Button
                    key={option.id}
                    variant={isActive && isAvailableForSale ? 'default' : 'outline'}
                    size="lg"
                    aria-disabled={!isAvailableForSale}
                    onClick={() => handleOptionSelect(type.name, type.id, option.id)}
                    title={`${option.label} ${!isAvailableForSale ? ' (Out of Stock)' : ''}`}
                    className={cn('min-w-16 font-medium', {
                      'line-through bg-secondary text-secondary-foreground': !isAvailableForSale,
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

const ColorVariantButton = ({
  isActive,
  isAvailableForSale,
  onSelect,
  option,
}: {
  isActive: boolean
  isAvailableForSale: boolean
  onSelect: () => void
  option: VariantOption
}) => {
  const colorValue = getColorValue(option.value)

  return (
    <button
      key={option.id}
      aria-label={`Select ${option.label}`}
      aria-disabled={!isAvailableForSale}
      onClick={onSelect}
      title={`${option.label} ${!isAvailableForSale ? ' (Out of Stock)' : ''}`}
      className={cn(
        'group relative h-10 w-10 rounded-full transition-all ring-offset-2',
        !isAvailableForSale ? 'opacity-50' : 'hover:ring-2 hover:ring-primary',
        isActive && 'ring-2 ring-primary',
      )}
    >
      <span
        className={cn('absolute inset-0 rounded-full border')}
        style={{ backgroundColor: colorValue }}
      />
      {/* Diagonal strike-through for out of stock */}
      {!isAvailableForSale && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-0.5 w-full rotate-45 bg-secondary-foreground" />
        </span>
      )}
    </button>
  )
}
