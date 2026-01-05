'use client'

import React from 'react'
import { useAddresses } from '@/hooks/use-address'
import { AddressItem, AddressItemSkeleton } from '@/components/addresses/address-item'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { MapPin } from 'lucide-react'
import { CreateAddressModal } from '@/components/addresses/create-address-modal'

export const AddressListing: React.FC = () => {
  const { data: addresses, isLoading } = useAddresses()

  if (isLoading) {
    return <AddressListingSkeleton />
  }

  if (!addresses || addresses.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MapPin className="h-12 w-12" />
          </EmptyMedia>
          <EmptyTitle>No addresses yet</EmptyTitle>
          <EmptyDescription>
            You haven&apos;t added any shipping or billing addresses. Add your first address for
            faster checkout.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <CreateAddressModal />
        </EmptyContent>
      </Empty>
    )
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

const AddressListingSkeleton: React.FC = () => {
  return (
    <div>
      <ul className="flex flex-col gap-8">
        {Array.from({ length: 2 }).map((_, index) => (
          <li key={index} className="border-b pb-8 last:border-none">
            <AddressItemSkeleton />
          </li>
        ))}
      </ul>
    </div>
  )
}
