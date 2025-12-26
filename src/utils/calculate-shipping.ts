import { normalizeStateName } from '@/lib/nigerian-states'
import { ShippingConfig } from '@/payload-types'

export interface ShippingCalculation {
  fee: number
  isFree: boolean
  stateNotFound?: boolean
}

/**
 * Calculate shipping fee based on state and cart subtotal
 * @param state - Nigerian state value (e.g., 'lagos', 'fct', etc.)
 * @param subtotal - Cart subtotal in kobo
 * @param shippingConfig - Shipping configuration data
 * @returns Shipping fee in kobo and whether it's free
 */
export function calculateShippingFee(
  state: string | undefined,
  subtotal: number,
  shippingConfig: ShippingConfig,
): ShippingCalculation {
  if (typeof subtotal !== 'number' || subtotal < 0) {
    throw new Error('Subtotal must be a non-negative number')
  }

  const defaultFee = shippingConfig.defaultFee 

  // Check if free shipping threshold is met
  const freeShippingThreshold = shippingConfig.freeShippingThreshold
  if (freeShippingThreshold && subtotal >= freeShippingThreshold) {
    return {
      fee: 0,
      isFree: true,
    }
  }

  // If no state provided, use default fee
  if (!state) {
    return {
      fee: defaultFee,
      isFree: false,
      stateNotFound: true,
    }
  }

  // Normalize state name for matching
  const normalizedState = normalizeStateName(state)

  // Find matching state configuration
  const states = shippingConfig.states || []
  const stateConfig = states.find((s) => s.state === normalizedState && s.enabled !== false)

  if (stateConfig) {
    return {
      fee: stateConfig.fee || defaultFee,
      isFree: false,
    }
  }

  // State not found or disabled, use default fee
  return {
    fee: defaultFee,
    isFree: false,
    stateNotFound: true,
  }
}

/**
 * Get shipping fee for a specific state (without free shipping logic)
 * Used for displaying shipping costs before cart is finalized
 * @param state - Nigerian state value
 * @param shippingConfig - Shipping configuration data
 * @returns Shipping fee in kobo
 */
export function getShippingFeeForState(state: string, shippingConfig: ShippingConfig): number {
  const result = calculateShippingFee(state, 0, shippingConfig)
  return result.fee
}
