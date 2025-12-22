import type { User } from '@/payload-types'

/**
 * Auth API functions
 * All authentication-related API calls
 */

const API_URL = process.env.NEXT_PUBLIC_SERVER_URL

const fetchJSON = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export const authApi = {
  /**
   * Fetch current authenticated user
   */
  getMe: async (): Promise<User | null> => {
    try {
      const data = await fetchJSON(`${API_URL}/api/users/me`)
      return data.user || null
    } catch {
      return null
    }
  },

  /**
   * Login user
   */
  login: async (credentials: { email: string; password: string }): Promise<User> => {
    const data = await fetchJSON(`${API_URL}/api/users/login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    })

    if (data.errors) {
      throw new Error(data.errors[0].message)
    }

    return data.user
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    await fetchJSON(`${API_URL}/api/users/logout`, {
      method: 'POST',
    })
  },

  /**
   * Create new user account
   */
  createUser: async (userData: {
    email: string
    password: string
    passwordConfirm: string
  }): Promise<User> => {
    const data = await fetchJSON(`${API_URL}/api/users`, {
      method: 'POST',
      body: JSON.stringify(userData),
    })

    if (data.errors) {
      throw new Error(data.errors[0].message)
    }

    const user = await authApi.login({ email: userData.email, password: userData.password })
    return user
  },

  /**
   * Request password reset email
   */
  forgotPassword: async (email: string): Promise<void> => {
    const data = await fetchJSON(`${API_URL}/api/users/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    })

    if (data.errors) {
      throw new Error(data.errors[0].message)
    }
  },

  /**
   * Reset password with token
   */
  resetPassword: async (resetData: {
    password: string
    passwordConfirm: string
    token: string
  }): Promise<User> => {
    const data = await fetchJSON(`${API_URL}/api/users/reset-password`, {
      method: 'POST',
      body: JSON.stringify(resetData),
    })

    if (data.errors) {
      throw new Error(data.errors[0].message)
    }

    return data.data?.loginUser?.user
  },
}
