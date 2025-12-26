/**
 * Official list of Nigerian states and Federal Capital Territory
 * Used for address validation and shipping fee configuration
 */

export const NIGERIAN_STATES = [
  { label: 'Abia', value: 'abia' },
  { label: 'Adamawa', value: 'adamawa' },
  { label: 'Akwa Ibom', value: 'akwa-ibom' },
  { label: 'Anambra', value: 'anambra' },
  { label: 'Bauchi', value: 'bauchi' },
  { label: 'Bayelsa', value: 'bayelsa' },
  { label: 'Benue', value: 'benue' },
  { label: 'Borno', value: 'borno' },
  { label: 'Cross River', value: 'cross-river' },
  { label: 'Delta', value: 'delta' },
  { label: 'Ebonyi', value: 'ebonyi' },
  { label: 'Edo', value: 'edo' },
  { label: 'Ekiti', value: 'ekiti' },
  { label: 'Enugu', value: 'enugu' },
  { label: 'Federal Capital Territory', value: 'fct' },
  { label: 'Gombe', value: 'gombe' },
  { label: 'Imo', value: 'imo' },
  { label: 'Jigawa', value: 'jigawa' },
  { label: 'Kaduna', value: 'kaduna' },
  { label: 'Kano', value: 'kano' },
  { label: 'Katsina', value: 'katsina' },
  { label: 'Kebbi', value: 'kebbi' },
  { label: 'Kogi', value: 'kogi' },
  { label: 'Kwara', value: 'kwara' },
  { label: 'Lagos', value: 'lagos' },
  { label: 'Nasarawa', value: 'nasarawa' },
  { label: 'Niger', value: 'niger' },
  { label: 'Ogun', value: 'ogun' },
  { label: 'Ondo', value: 'ondo' },
  { label: 'Osun', value: 'osun' },
  { label: 'Oyo', value: 'oyo' },
  { label: 'Plateau', value: 'plateau' },
  { label: 'Rivers', value: 'rivers' },
  { label: 'Sokoto', value: 'sokoto' },
  { label: 'Taraba', value: 'taraba' },
  { label: 'Yobe', value: 'yobe' },
  { label: 'Zamfara', value: 'zamfara' },
]

/**
 * Get state label from value
 */
export function getStateLabel(value: string): string | undefined {
  return NIGERIAN_STATES.find((state) => state.value === value)?.label
}

/**
 * Normalize state name for matching (handles free-text variations)
 * Used for backward compatibility with existing free-text state fields
 */
export function normalizeStateName(stateName: string): string {
  const normalized = stateName.toLowerCase().trim()

  // Direct mapping for common variations
  const stateMap: Record<string, string> = {
    fct: 'fct',
    abuja: 'fct',
    'federal capital territory': 'fct',
    fcta: 'fct',
    'akwa ibom': 'akwa-ibom',
    'cross river': 'cross-river',
  }

  // Check direct mapping first
  if (stateMap[normalized]) {
    return stateMap[normalized]
  }

  // Try to find matching state value
  const matchingState = NIGERIAN_STATES.find(
    (state) =>
      state.value === normalized ||
      state.label.toLowerCase() === normalized ||
      state.label.toLowerCase().replace(/\s+/g, '-') === normalized ||
      state.label.toLowerCase().replace(/\s+/g, '') === normalized,
  )

  return matchingState?.value || normalized
}
