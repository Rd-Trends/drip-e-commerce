import type { Address } from '@/payload-types'
import type { DefaultDocumentIDType } from 'payload'
import * as qs from 'qs-esm'

/**
 * Address API functions
 * All address-related API calls
 *
 * @example
 * // Direct API usage
 * import { addressApi } from '@/lib/api/address'
 *
 * const addresses = await addressApi.getAddresses()
 * const address = await addressApi.createAddress({ street1: '123 Main St', ... })
 *
 * @example
 * // Using React hooks (recommended)
 * import { useAddresses, useCreateAddress } from '@/hooks/use-address'
 *
 * const { data: addresses } = useAddresses()
 * const { mutate: createAddress } = useCreateAddress()
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

export type AddressInput = Omit<Address, 'id' | 'createdAt' | 'updatedAt'>

/**
 * Get all addresses for the authenticated user
 */
export const getAddresses = async (): Promise<{ docs: Address[] }> => {
  const query = qs.stringify({
    depth: 0,
    limit: 0,
    pagination: false,
  })

  return fetchJSON(`${API_URL}/api/addresses?${query}`)
}

/**
 * Get a single address by ID
 */
export const getAddress = async (addressID: DefaultDocumentIDType): Promise<Address> => {
  return fetchJSON(`${API_URL}/api/addresses/${addressID}`)
}

/**
 * Create a new address
 */
export const createAddress = async (address: Partial<AddressInput>): Promise<Address> => {
  return fetchJSON(`${API_URL}/api/addresses`, {
    method: 'POST',
    body: JSON.stringify(address),
  })
}

/**
 * Update an existing address
 */
export const updateAddress = async (
  addressID: DefaultDocumentIDType,
  address: Partial<AddressInput>,
): Promise<Address> => {
  return fetchJSON(`${API_URL}/api/addresses/${addressID}`, {
    method: 'PATCH',
    body: JSON.stringify(address),
  })
}

/**
 * Delete an address
 */
export const deleteAddress = async (addressID: DefaultDocumentIDType): Promise<void> => {
  return fetchJSON(`${API_URL}/api/addresses/${addressID}`, {
    method: 'DELETE',
  })
}

export const addressApi = {
  getAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
}
