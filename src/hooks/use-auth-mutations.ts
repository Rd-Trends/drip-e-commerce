'use client'

import type { User } from '@/payload-types'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { authApi } from '@/lib/api/auth'
import { queryKeys } from '@/lib/query-keys'

/**
 * Hook for user login
 * @example
 * const { mutate: login, isPending, error } = useLogin()
 * login({ email: 'user@example.com', password: 'password' })
 */
export const useLogin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.user(), user)
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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.auth.user(), null)
      // Optionally invalidate all auth-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all })
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

  return useMutation({
    mutationFn: authApi.createUser,
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.user(), user)
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
