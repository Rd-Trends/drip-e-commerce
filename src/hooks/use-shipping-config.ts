'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import type { ShippingConfig } from '@/payload-types'

/**
 * Fetch shipping configuration from the API
 */
const fetchShippingConfig = async (): Promise<ShippingConfig> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/api/globals/shipping-config`,
    {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch shipping config: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Hook to fetch shipping configuration
 * @example
 * const { data: shippingConfig, isLoading, error } = useShippingConfig()
 */
export const useShippingConfig = () => {
  return useQuery({
    queryKey: queryKeys.shippingConfig.detail(),
    queryFn: fetchShippingConfig,
    staleTime: 1000 * 60 * 5, // 5 minutes - shipping config doesn't change often
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}
