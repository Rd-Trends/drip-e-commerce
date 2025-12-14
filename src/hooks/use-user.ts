'use client'

import type { User } from '@/payload-types'

import { useQuery } from '@tanstack/react-query'

import { authApi } from '@/lib/api/auth'
import { queryKeys } from '@/lib/query-keys'

/**
 * Hook to fetch and cache the current authenticated user
 *
 * @example
 * const { data: user, isLoading, error } = useUser()
 *
 * @returns Query result with user data, loading state, and error
 */
export const useUser = () => {
  return useQuery<User | null>({
    queryKey: queryKeys.auth.user(),
    queryFn: authApi.getMe,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Revalidate when user returns to tab
    refetchOnReconnect: true, // Revalidate on network reconnection
  })
}
