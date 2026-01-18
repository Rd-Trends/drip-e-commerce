'use client'

import type { User } from '@/payload-types'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { authApi } from '@/lib/api/auth'
import { cartApi } from '@/lib/api/cart'
import { queryKeys } from '@/lib/query-keys'
import { useCart } from '@/providers/cart'

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

/**
 * Hook for user login
 * @example
 * const { mutate: login, isPending, error } = useLogin()
 * login({ email: 'user@example.com', password: 'password' })
 */
export const useLogin = () => {
  const queryClient = useQueryClient()
  const { cartID, cartSecret, updateCartIdentifier, clearCartStorage } = useCart()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (user) => {
      queryClient.setQueryData(queryKeys.auth.user(), user)

      // Merge guest cart with user cart after successful login
      try {
        const result = await cartApi.mergeGuestCart({
          guestCartId: cartID,
          guestCartSecret: cartSecret,
        })

        if (result.success && result.cart) {
          // Update cart identifier with the merged/user cart
          updateCartIdentifier({
            cartID: result.cart.id as number,
            secret: result.cart.secret ?? undefined,
          })

          // Invalidate cart query to refetch with new data
          queryClient.invalidateQueries({ queryKey: queryKeys.cart.detail(result.cart.id) })
        } else if (result.success && !result.cart) {
          // User has no cart, clear storage
          clearCartStorage()
        }
      } catch (error) {
        console.error('Error merging guest cart:', error)
        // Don't fail the login if cart merge fails
        // Just clear the cart storage to be safe
        clearCartStorage()
      }
    },
  })
}

/**
 * Hook for user logout
 * @example
 * const { mutate: logout, isPending } = useLogout()
 * logout()
 */
export const useLogout = () => {
  const { clearCartStorage } = useCart()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.auth.user(), null)
      // Optionally invalidate all auth-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all })
      clearCartStorage()
    },
  })
}

/**
 * Hook for creating a new user account
 * @example
 * const { mutate: createUser, isPending, error } = useCreateUser()
 * createUser({ email: 'user@example.com', password: 'password', passwordConfirm: 'password' })
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient()
  const { cartID, cartSecret, updateCartIdentifier, clearCartStorage } = useCart()

  return useMutation({
    mutationFn: authApi.createUser,
    onSuccess: async (user) => {
      queryClient.setQueryData(queryKeys.auth.user(), user)

      // Merge guest cart with user cart after successful account creation
      try {
        const result = await cartApi.mergeGuestCart({
          guestCartId: cartID,
          guestCartSecret: cartSecret,
        })

        if (result.success && result.cart) {
          // Update cart identifier with the merged/user cart
          updateCartIdentifier({
            cartID: result.cart.id as number,
            secret: result.cart.secret ?? undefined,
          })

          // Invalidate cart query to refetch with new data
          queryClient.invalidateQueries({ queryKey: queryKeys.cart.detail(result.cart.id) })
        } else if (result.success && !result.cart) {
          // User has no cart, clear storage
          clearCartStorage()
        }
      } catch (error) {
        console.error('Error merging guest cart:', error)
        // Don't fail the account creation if cart merge fails
        // Just clear the cart storage to be safe
        clearCartStorage()
      }
    },
  })
}

/**
 * Hook for requesting password reset email
 * @example
 * const { mutate: forgotPassword, isPending, error } = useForgotPassword()
 * forgotPassword('user@example.com')
 */
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  })
}

/**
 * Hook for resetting password with token
 * @example
 * const { mutate: resetPassword, isPending, error } = useResetPassword()
 * resetPassword({ password: 'newpass', passwordConfirm: 'newpass', token: 'reset-token' })
 */
export const useResetPassword = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: (user) => {
      if (user) {
        queryClient.setQueryData(queryKeys.auth.user(), user)
      }
    },
  })
}

/**
 * Hook to manually update user data in cache
 * Useful for optimistic updates or manual cache management
 */
export const useSetUser = () => {
  const queryClient = useQueryClient()

  return (user: User | null) => {
    queryClient.setQueryData(queryKeys.auth.user(), user)
  }
}

/**
 * Hook for updating user profile
 * @example
 * const { mutate: updateProfile, isPending } = useUpdateProfile()
 * updateProfile({ userID: 123, data: { name: 'John Doe' } })
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userID, data }: { userID: number; data: { name?: string } }) =>
      authApi.updateProfile(userID, data),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.user(), user)
    },
  })
}

/**
 * Hook for changing password
 * @example
 * const { mutate: changePassword, isPending } = useChangePassword()
 * changePassword({ userID: 123, password: 'newpassword' })
 */
export const useChangePassword = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userID, password }: { userID: number; password: string }) =>
      authApi.changePassword(userID, { password }),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.user(), user)
    },
  })
}
