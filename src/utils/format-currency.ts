import { currenciesConfig } from '@/lib/constants'
import { Currency } from '@payloadcms/plugin-ecommerce/types'

/**
 * Format a price value from kobo to NGN with proper formatting
 * @param value - The value in kobo (base unit)
 * @param options - Optional currency override
 * @returns Formatted currency string (e.g., "₦1,234.56")
 */
export function formatCurrency(value?: null | number, options?: { currency?: Currency }): string {
  if (value === undefined || value === null) {
    return ''
  }

  const currencyToUse =
    options?.currency ||
    currenciesConfig.supportedCurrencies.find((c) => c.code === currenciesConfig.defaultCurrency)!

  if (!currencyToUse) {
    return value.toString()
  }

  if (value === 0) {
    return `${currencyToUse.symbol}0.${'0'.repeat(currencyToUse.decimals)}`
  }

  // Convert from base value (e.g., kobo) to decimal value (e.g., naira)
  const decimalValue = value / Math.pow(10, currencyToUse.decimals)

  // Format with the correct number of decimal places and thousand separators
  const formattedNumber = decimalValue
    .toLocaleString('en-NG', {
      minimumFractionDigits: currencyToUse.decimals,
      maximumFractionDigits: currencyToUse.decimals,
    })
    .replace('.00', '')

  return `${currencyToUse.symbol}${formattedNumber}`
}
