'use client'

import { AddressItem } from '@/components/addresses/address-item'
import { CreateAddressModal } from '@/components/addresses/create-address-modal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Address, User } from '@/payload-types'
import React from 'react'
import { CheckoutAddresses } from './checkout-addresses'

interface ShippingInformationProps {
  user: User | null
  email: string
  emailEditable: boolean
  paymentData: Record<string, unknown> | null
  shippingAddress: Partial<Address> | undefined
  onShippingAddressChange: React.Dispatch<React.SetStateAction<Partial<Address> | undefined>>
}

export const ShippingInformation: React.FC<ShippingInformationProps> = ({
  user,
  email,
  emailEditable,
  paymentData,
  shippingAddress,
  onShippingAddressChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping Information</CardTitle>
        <CardDescription>Where should we deliver your order?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {shippingAddress ? (
          <div className="rounded-lg border p-4 bg-muted/30">
            <div className="flex items-start justify-between gap-4">
              <AddressItem address={shippingAddress} />
              <Button
                variant="ghost"
                size="sm"
                disabled={Boolean(paymentData)}
                onClick={(e) => {
                  e.preventDefault()
                  onShippingAddressChange(undefined)
                }}
              >
                Change
              </Button>
            </div>
          </div>
        ) : user ? (
          <CheckoutAddresses
            heading="Select shipping address"
            setAddress={onShippingAddressChange}
          />
        ) : (
          <CreateAddressModal
            disabled={!email || Boolean(emailEditable)}
            callback={(address) => {
              onShippingAddressChange(address)
            }}
            skipSubmission={true}
          />
        )}
      </CardContent>
    </Card>
  )
}
