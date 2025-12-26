import { ShippingConfig } from '@/payload-types'

/**
 * Default shipping fees for Nigerian states (in kobo)
 * Adjust these values according to your actual shipping rates
 */
const defaultShippingRates: Array<{
  state:
    | 'lagos'
    | 'ogun'
    | 'oyo'
    | 'osun'
    | 'ondo'
    | 'ekiti'
    | 'delta'
    | 'edo'
    | 'rivers'
    | 'bayelsa'
    | 'cross-river'
    | 'akwa-ibom'
    | 'anambra'
    | 'enugu'
    | 'ebonyi'
    | 'imo'
    | 'abia'
    | 'fct'
    | 'nasarawa'
    | 'niger'
    | 'kogi'
    | 'benue'
    | 'plateau'
    | 'kwara'
    | 'kaduna'
    | 'kano'
    | 'katsina'
    | 'jigawa'
    | 'zamfara'
    | 'sokoto'
    | 'kebbi'
    | 'bauchi'
    | 'gombe'
    | 'borno'
    | 'yobe'
    | 'taraba'
    | 'adamawa'
  fee: number
}> = [
  // Southwest (typically lower rates due to proximity to Lagos)
  { state: 'lagos', fee: 100000 }, // ₦1,000
  { state: 'ogun', fee: 120000 }, // ₦1,200
  { state: 'oyo', fee: 150000 }, // ₦1,500
  { state: 'osun', fee: 160000 }, // ₦1,600
  { state: 'ondo', fee: 180000 }, // ₦1,800
  { state: 'ekiti', fee: 200000 }, // ₦2,000

  // South-South
  { state: 'delta', fee: 200000 }, // ₦2,000
  { state: 'edo', fee: 180000 }, // ₦1,800
  { state: 'rivers', fee: 220000 }, // ₦2,200
  { state: 'bayelsa', fee: 250000 }, // ₦2,500
  { state: 'cross-river', fee: 240000 }, // ₦2,400
  { state: 'akwa-ibom', fee: 230000 }, // ₦2,300

  // Southeast
  { state: 'anambra', fee: 200000 }, // ₦2,000
  { state: 'enugu', fee: 210000 }, // ₦2,100
  { state: 'ebonyi', fee: 220000 }, // ₦2,200
  { state: 'imo', fee: 200000 }, // ₦2,000
  { state: 'abia', fee: 190000 }, // ₦1,900

  // North Central
  { state: 'fct', fee: 150000 }, // ₦1,500 (Abuja)
  { state: 'nasarawa', fee: 170000 }, // ₦1,700
  { state: 'niger', fee: 180000 }, // ₦1,800
  { state: 'kogi', fee: 190000 }, // ₦1,900
  { state: 'benue', fee: 200000 }, // ₦2,000
  { state: 'plateau', fee: 220000 }, // ₦2,200
  { state: 'kwara', fee: 180000 }, // ₦1,800

  // Northwest
  { state: 'kaduna', fee: 250000 }, // ₦2,500
  { state: 'kano', fee: 280000 }, // ₦2,800
  { state: 'katsina', fee: 300000 }, // ₦3,000
  { state: 'jigawa', fee: 290000 }, // ₦2,900
  { state: 'zamfara', fee: 280000 }, // ₦2,800
  { state: 'sokoto', fee: 320000 }, // ₦3,200
  { state: 'kebbi', fee: 300000 }, // ₦3,000

  // Northeast
  { state: 'bauchi', fee: 280000 }, // ₦2,800
  { state: 'gombe', fee: 290000 }, // ₦2,900
  { state: 'borno', fee: 350000 }, // ₦3,500
  { state: 'yobe', fee: 340000 }, // ₦3,400
  { state: 'taraba', fee: 300000 }, // ₦3,000
  { state: 'adamawa', fee: 310000 }, // ₦3,100
]

export const shippingConfigSeedData: Omit<ShippingConfig, 'id' | 'createdAt' | 'updatedAt'> = {
  states: defaultShippingRates,
  defaultFee: 150000, // ₦1,500 for states not listed
  taxRate: 7.5, // 7.5% tax rate
}
