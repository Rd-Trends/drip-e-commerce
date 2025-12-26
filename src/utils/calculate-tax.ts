/**
 * Calculate tax amount based on subtotal and tax rate
 * @param subtotal - Subtotal amount in kobo (before shipping and tax)
 * @param taxRate - Tax rate as a percentage (e.g., 7.5 for 7.5%)
 * @returns Tax amount in kobo
 */
export function calculateTax(subtotal: number, taxRate: number = 7.5): number {
  if (typeof subtotal !== 'number' || subtotal < 0) {
    throw new Error('Subtotal must be a non-negative number')
  }

  if (typeof taxRate !== 'number' || taxRate < 0 || taxRate > 100) {
    throw new Error('Tax rate must be between 0 and 100')
  }

  // Calculate tax: subtotal * (taxRate / 100)
  return Math.round(subtotal * (taxRate / 100))
}
