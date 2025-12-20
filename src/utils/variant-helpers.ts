import type { Product, Variant } from '@/payload-types'

/**
 * Check if a variant option is available given the current selections
 * @param variants - Array of product variants
 * @param variantTypeId - The variant type ID to check
 * @param optionId - The option ID to check
 * @param selectedOptions - Map of currently selected options (variantTypeId -> optionId)
 * @returns true if the option is available, false otherwise
 */
export function isOptionAvailable(
  variants: Product['variants'],
  variantTypeId: number,
  optionId: number,
  selectedOptions: Record<number, number>,
): boolean {
  if (!variants?.docs) return false

  const testSelection = { ...selectedOptions, [variantTypeId]: optionId }

  // Get all selected variant type IDs
  const selectedTypeIds = Object.keys(testSelection).map(Number)

  // If only one type selected, check if any variant exists with this option
  if (selectedTypeIds.length === 1) {
    return variants.docs.some((v) => {
      if (typeof v !== 'object' || !v.options) return false
      if (!v.inventory || v.inventory <= 0) return false

      return v.options?.some((variantOption) => {
        if (typeof variantOption !== 'object') return false
        return variantOption.variantType === variantTypeId && variantOption.id === optionId
      })
    })
  }

  // For multiple selections, check if a valid combination exists
  return variants.docs.some((variant) => {
    if (typeof variant !== 'object' || !variant.options) return false
    if (!variant.inventory || variant.inventory <= 0) return false

    return selectedTypeIds.every((typeId) => {
      const selectedOptionId = testSelection[typeId]
      return variant.options?.some((o) => {
        if (typeof o !== 'object') return false
        return o.variantType === typeId && o.id === selectedOptionId
      })
    })
  })
}

/**
 * Find a matching variant based on the current option selections
 * @param variants - Array of product variants
 * @param testSelections - Map of selected options (variantTypeId -> optionId)
 * @param variantTypeCount - Total number of variant types
 * @returns The matching variant or undefined
 */
export function findMatchingVariant(
  variants: Product['variants'],
  testSelections: Record<number, number>,
  variantTypeCount: number,
): Variant | undefined {
  if (!variants?.docs) return undefined

  const testSelectedTypeIds = Object.keys(testSelections).map(Number)

  // Only find a match if all variant types are selected
  if (testSelectedTypeIds.length !== variantTypeCount) {
    return undefined
  }

  const matchingVariant = variants.docs.find((variant) => {
    if (typeof variant !== 'object' || !variant.options) return false

    return testSelectedTypeIds.every((typeId) => {
      const selectedOptionId = testSelections[typeId]
      return variant.options!.some((o) => {
        if (typeof o !== 'object') return false
        return o.variantType === typeId && o.id === selectedOptionId
      })
    })
  })

  return matchingVariant && typeof matchingVariant === 'object' ? matchingVariant : undefined
}

/**
 * Map color names to hex values for visual display
 * @param value - The color name or hex value
 * @returns The hex color value
 */
export function getColorValue(value: string): string {
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
  return colorMap[normalized] || value
}
