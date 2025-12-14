import type { Cart } from '@/payload-types'
import type { DefaultDocumentIDType } from 'payload'
import * as qs from 'qs-esm'

/**
 * Cart API functions
 * All cart-related API calls
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
    const errorText = await response.text()
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
  }

  return response.json()
}

export type CartItemInput = {
  product: DefaultDocumentIDType
  variant?: DefaultDocumentIDType
}

type BaseQueryParams = {
  depth: number
  populate: Record<string, unknown>
  select: Record<string, boolean>
}

export const getBaseQuery = (currencyCode: string): BaseQueryParams => {
  const priceField = `priceIn${currencyCode}`

  return {
    depth: 2,
    populate: {
      products: {
        [priceField]: true,
        slug: true,
        title: true,
        gallery: true,
        inventory: true,
      },
      variants: {
        options: true,
        [priceField]: true,
        title: true,
        inventory: true,
      },
    },
    select: {
      items: true,
      subtotal: true,
      secret: true,
    },
  }
}

export const cartApi = {
  /**
   * Get cart by ID
   */
  getCart: async (
    cartID: DefaultDocumentIDType,
    options: {
      secret?: string | null
      currencyCode: string
    },
  ): Promise<Cart> => {
    const { secret, currencyCode } = options
    const baseQuery = getBaseQuery(currencyCode)

    const queryParams = {
      ...baseQuery,
      ...(secret ? { secret } : {}),
    }
    const query = qs.stringify(queryParams)

    const data = await fetchJSON(`${API_URL}/api/carts/${cartID}?${query}`)

    if (data.error) {
      throw new Error(`Cart fetch error: ${data.error}`)
    }

    return data as Cart
  },

  /**
   * Create a new cart
   */
  createCart: async (cartData: {
    items?: Array<CartItemInput & { quantity: number }>
    currencyCode: string
    customerID?: string | number
  }): Promise<Cart> => {
    const { items, currencyCode, customerID } = cartData
    const baseQuery = getBaseQuery(currencyCode)
    const query = qs.stringify(baseQuery)

    const data = await fetchJSON(`${API_URL}/api/carts?${query}`, {
      method: 'POST',
      body: JSON.stringify({
        items: items || [],
        currency: currencyCode,
        customer: customerID,
      }),
    })

    if (data.error) {
      throw new Error(`Cart creation error: ${data.error}`)
    }

    return data.doc as Cart
  },

  /**
   * Update cart
   */
  updateCart: async (
    cartID: DefaultDocumentIDType,
    updates: Partial<Cart>,
    options: {
      secret?: string | null
      currencyCode: string
    },
  ): Promise<Cart> => {
    const { secret, currencyCode } = options
    const baseQuery = getBaseQuery(currencyCode)

    const queryParams = {
      ...baseQuery,
      ...(secret ? { secret } : {}),
    }
    const query = qs.stringify(queryParams)

    const data = await fetchJSON(`${API_URL}/api/carts/${cartID}?${query}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })

    if (data.error) {
      throw new Error(`Cart update error: ${data.error}`)
    }

    return data.doc as Cart
  },

  /**
   * Delete cart
   */
  deleteCart: async (
    cartID: DefaultDocumentIDType,
    options: {
      secret?: string | null
    },
  ): Promise<void> => {
    const { secret } = options

    const queryParams = secret ? { secret } : {}
    const query = qs.stringify(queryParams)
    const url = `${API_URL}/api/carts/${cartID}${query ? `?${query}` : ''}`

    await fetchJSON(url, {
      method: 'DELETE',
    })
  },
}
