'use client'

import type { User } from '@/payload-types'

import React, { createContext, useContext } from 'react'

import { useUser } from '@/hooks/use-auth'

type AuthContext = {
  user: User | null
  isLoading: boolean
}

const Context = createContext({} as AuthContext)

/**
 * Auth Provider - Provides user state and loading status
 * For mutations (login, logout, etc.), use the custom hooks from @/hooks/use-auth
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: user, isLoading } = useUser()

  return (
    <Context.Provider
      value={{
        user: user ?? null,
        isLoading,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export function useAuth() {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
