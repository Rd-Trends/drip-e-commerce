'use client'

import { AddressItem } from '@/components/addresses/address-item'
import { CreateAddressModal } from '@/components/addresses/create-address-modal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Address, User } from '@/payload-types'
import React from 'react'
import { CheckoutAddresses } from './checkout-addresses'

interface ShippingInformationProps {
  user: User | null
  email: string
  emailEditable: boolean
  paymentData: Record<string, unknown> | null
  billingAddress: Partial<Address> | undefined
  shippingAddress: Partial<Address> | undefined
  billingAddressSameAsShipping: boolean
  onBillingAddressChange: React.Dispatch<React.SetStateAction<Partial<Address> | undefined>>
  onShippingAddressChange: React.Dispatch<React.SetStateAction<Partial<Address> | undefined>>
  onBillingAddressSameAsShippingChange: (value: boolean) => void
}

export const ShippingInformation: React.FC<ShippingInformationProps> = ({
  user,
  email,
  emailEditable,
  paymentData,
  billingAddress,
  shippingAddress,
  billingAddressSameAsShipping,
  onBillingAddressChange,
  onShippingAddressChange,
  onBillingAddressSameAsShippingChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping Information</CardTitle>
        <CardDescription>Where should we deliver your order?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {billingAddress ? (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="flex items-start justify-between gap-4">
                <AddressItem address={billingAddress} />
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={Boolean(paymentData)}
                  onClick={(e) => {
                    e.preventDefault()
                    onBillingAddressChange(undefined)
                  }}
                >
                  Change
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="shippingTheSameAsBilling"
                checked={billingAddressSameAsShipping}
                disabled={Boolean(paymentData || (!user && (!email || Boolean(emailEditable))))}
                onCheckedChange={(state) => {
                  onBillingAddressSameAsShippingChange(state as boolean)
                }}
              />
              <Label
                htmlFor="shippingTheSameAsBilling"
                className="text-sm font-normal cursor-pointer"
              >
                Use same address for billing
              </Label>
            </div>

            {!billingAddressSameAsShipping && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-base">Billing Address</Label>
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
                      heading="Select billing address"
                      description="Please select a billing address."
                      setAddress={onShippingAddressChange}
                    />
                  ) : (
                    <CreateAddressModal
                      callback={(address) => {
                        onShippingAddressChange(address)
                      }}
                      disabled={!email || Boolean(emailEditable)}
                      skipSubmission={true}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        ) : user ? (
          <CheckoutAddresses
            heading="Select shipping address"
            setAddress={onBillingAddressChange}
          />
        ) : (
          <CreateAddressModal
            disabled={!email || Boolean(emailEditable)}
            callback={(address) => {
              onBillingAddressChange(address)
            }}
            skipSubmission={true}
          />
        )}
      </CardContent>
    </Card>
  )
}
