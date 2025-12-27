'use client'

import React from 'react'
import type { Address } from '@/payload-types'
import { CreateAddressModal } from '@/components/addresses/create-address-modal'
import { getStateLabel } from '@/lib/nigerian-states'

type Props = {
  address: Partial<Address> // Allow address to be partial and entirely optional as this is entirely for display purposes
  /**
   * Completely override the default actions
   */
  actions?: React.ReactNode
  /**
   * Insert elements before the actions
   */
  beforeActions?: React.ReactNode
  /**
   * Insert elements after the actions
   */
  afterActions?: React.ReactNode
  /**
   * Hide all actions
   */
  hideActions?: boolean
}

export const AddressItem: React.FC<Props> = ({
  address,
  actions,
  hideActions = false,
  beforeActions,
  afterActions,
}) => {
  if (!address) {
    return null
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1 text-sm">
        <p className="font-semibold leading-none">
          {address.title && <span>{address.title} - </span>}
          {address.firstName} {address.lastName}
        </p>
        {address.company && <p className="text-muted-foreground">{address.company}</p>}
        {address.phone && <p className="text-muted-foreground">{address.phone}</p>}
        <p className="font-mono">{address.addressLine1}</p>
        {address.addressLine2 && <p className="font-mono">{address.addressLine2}</p>}
        <p className="font-mono">
          {address.city}, {address.state ? getStateLabel(address.state) || address.state : ''}{' '}
          {address.postalCode}
        </p>
        <p className="font-mono">{address.country}</p>
      </div>

      {!hideActions && address.id && (
        <div className="flex flex-col gap-2">
          {actions ? (
            actions
          ) : (
            <>
              {beforeActions}
              {address.id && (
                <CreateAddressModal
                  addressID={address.id}
                  initialData={address}
                  buttonText={'Edit'}
                  modalTitle={'Edit address'}
                />
              )}
              {afterActions}
            </>
          )}
        </div>
      )}
    </div>
  )
}
