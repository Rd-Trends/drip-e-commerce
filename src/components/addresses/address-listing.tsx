'use client'

import React from 'react'
import { useAddresses } from '@/hooks/use-address'
import { AddressItem } from '@/components/addresses/address-item'

export const AddressListing: React.FC = () => {
  const { data: addresses, isLoading } = useAddresses()

  if (!addresses || addresses.length === 0) {
    return <p>No addresses found.</p>
  }

  return (
    <div>
      <ul className="flex flex-col gap-8">
        {addresses.map((address) => (
          <li key={address.id} className="border-b pb-8 last:border-none">
            <AddressItem address={address} />
          </li>
        ))}
      </ul>
    </div>
  )
}
