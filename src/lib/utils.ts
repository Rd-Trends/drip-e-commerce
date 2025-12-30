import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency in Nigerian Naira
 * @param value Amount in kobo (smallest unit)
 * @returns Formatted currency string (e.g., ₦1,234.00)
 */
export function formatCurrency(value?: number | null): string {
  if (value === undefined || value === null) {
    return '₦0.00'
  }

  // Convert from kobo to naira
  const naira = value / 100

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(naira)
}
