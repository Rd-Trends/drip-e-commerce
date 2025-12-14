'use client'

import type { Address } from '@/payload-types'
import type { DefaultDocumentIDType } from 'payload'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { addressApi, type AddressInput } from '@/lib/api/address'
import { queryKeys } from '@/lib/query-keys'
import { useAuth } from '@payloadcms/ui'

/**
 * Hook for fetching all addresses for the authenticated user
 * @example
 * const { data: addresses, isLoading, error } = useAddresses()
 */
export const useAddresses = () => {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.address.list(),
    queryFn: () => addressApi.getAddresses(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (data) => data.docs,
  })
}

/**
 * Hook for fetching a single address by ID
 * @example
 * const { data: address, isLoading } = useAddress(addressID)
 */
export const useAddress = (addressID: DefaultDocumentIDType | undefined) => {
  return useQuery({
    queryKey: queryKeys.address.detail(addressID || ''),
    queryFn: () => {
      if (!addressID) throw new Error('No address ID')
      return addressApi.getAddress(addressID)
    },
    enabled: !!addressID,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for creating a new address
 * @example
 * const { mutate: createAddress, isPending } = useCreateAddress()
 * createAddress({ street1: '123 Main St', city: 'Lagos', ... })
 */
export const useCreateAddress = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (address: Partial<AddressInput>) => {
      if (!user) {
        throw new Error('User must be logged in to create an address')
      }
      return addressApi.createAddress(address)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.address.list() })
    },
  })
}

/**
 * Hook for updating an existing address
 * @example
 * const { mutate: updateAddress, isPending } = useUpdateAddress()
 * updateAddress({ addressID: 123, data: { street1: '456 New St' } })
 */
export const useUpdateAddress = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (params: { addressID: DefaultDocumentIDType; data: Partial<AddressInput> }) => {
      if (!user) {
        throw new Error('User must be logged in to update an address')
      }
      return addressApi.updateAddress(params.addressID, params.data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.address.list() })
      queryClient.setQueryData(queryKeys.address.detail(data.id), data)
    },
  })
}

/**
 * Hook for deleting an address
 * @example
 * const { mutate: deleteAddress, isPending } = useDeleteAddress()
 * deleteAddress(addressID)
 */
export const useDeleteAddress = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (addressID: DefaultDocumentIDType) => {
      if (!user) {
        throw new Error('User must be logged in to delete an address')
      }
      return addressApi.deleteAddress(addressID)
    },
    onSuccess: (_, addressID) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.address.list() })
      queryClient.removeQueries({ queryKey: queryKeys.address.detail(addressID) })
    },
  })
}
