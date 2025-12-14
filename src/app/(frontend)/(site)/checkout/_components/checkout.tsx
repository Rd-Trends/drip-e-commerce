'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Container } from '@/components/layout/container'
import { Section } from '@/components/layout/section'
import { useAuth } from '@/providers/auth'
import { useCart } from '@/providers/cart'
import { useDeleteCart } from '@/hooks/use-cart-queries'
import { useConfirmOrder, useInitiatePayment } from '@/hooks/use-payment'
import { Address } from '@/payload-types'
import { useAddresses } from '@payloadcms/plugin-ecommerce/client/react'
import { AlertCircleIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CheckoutSkeleton } from './checkout-skeleton'
import { ContactInformation } from './contact-information'
import { OrderSummary } from './order-summary'
import { ShippingInformation } from './shipping-information'

export const CheckoutPage: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const { cart, isLoading } = useCart()
  const { addresses } = useAddresses()
  const { mutate: clearCart } = useDeleteCart()
  const initiatePayment = useInitiatePayment()
  const confirmOrder = useConfirmOrder()

  const [error, setError] = useState<null | string>(null)
  const [email, setEmail] = useState('')
  const [emailEditable, setEmailEditable] = useState(true)
  const [paymentData, setPaymentData] = useState<null | Record<string, unknown>>(null)
  const [shippingAddress, setShippingAddress] = useState<Partial<Address>>()
  const [billingAddress, setBillingAddress] = useState<Partial<Address>>()
  const [billingAddressSameAsShipping, setBillingAddressSameAsShipping] = useState(true)

  const cartIsEmpty = !cart || !cart.items || !cart.items.length
  const canGoToPayment = Boolean(
    (email || user) && billingAddress && (billingAddressSameAsShipping || shippingAddress),
  )

  // On initial load wait for addresses to be loaded and check to see if we can prefill a default one
  useEffect(() => {
    if (!shippingAddress) {
      if (addresses && addresses.length > 0) {
        const defaultAddress = addresses[0]
        if (defaultAddress) {
          setBillingAddress(defaultAddress)
        }
      }
    }
  }, [addresses])

  useEffect(() => {
    return () => {
      setShippingAddress(undefined)
      setBillingAddress(undefined)
      setBillingAddressSameAsShipping(true)
      setEmail('')
      setEmailEditable(true)
    }
  }, [])

  const handlePaymentSuccess = useCallback(
    (reference: string) => {
      toast.promise(
        async () => {
          const confirmResult = await confirmOrder.mutateAsync({
            paymentMethodID: 'paystack',
            additionalData: {
              reference,
              ...(email ? { customerEmail: email } : {}),
            },
          })

          if (
            confirmResult &&
            typeof confirmResult === 'object' &&
            'orderID' in confirmResult &&
            confirmResult.orderID
          ) {
            const redirectUrl = `/orders/${confirmResult.orderID}${email ? `?email=${email}` : ''}`
            clearCart()
            router.push(redirectUrl)
          }
        },
        {
          loading: 'Confirming your order...',
          success: 'Order confirmed successfully!',
          error: 'Error while confirming your order.',
        },
      )
    },
    [clearCart, router, confirmOrder, email],
  )

  const initiatePaymentIntent = useCallback(
    async (paymentID: string) => {
      initiatePayment.mutate(
        {
          paymentMethodID: paymentID,
          additionalData: {
            ...(email ? { customerEmail: email } : {}),
            billingAddress,
            shippingAddress: billingAddressSameAsShipping ? billingAddress : shippingAddress,
          },
        },
        {
          onSuccess: async (paymentData) => {
            if (paymentData.accessCode) {
              const Paystack = (await import('@paystack/inline-js')).default
              const popup = new Paystack()
              popup.resumeTransaction(paymentData.accessCode as string, {
                onSuccess: () => handlePaymentSuccess(paymentData.reference as string),
                onError: () => {
                  toast.error('Payment was not completed. Please try again.')
                  setError('Payment was not completed. Please try again.')
                },
                onCancel: () => {
                  toast.error('Payment was cancelled.')
                  setError('Payment was cancelled.')
                },
              })
              setPaymentData(paymentData)
            }
          },
          onError: (error) => {
            const errorData = error instanceof Error ? JSON.parse(error.message) : {}
            let errorMessage = 'An error occurred while initiating payment.'

            if (errorData?.cause?.code === 'OutOfStock') {
              errorMessage = 'One or more items in your cart are out of stock.'
            }

            setError(errorMessage)
            toast.error(errorMessage)
          },
        },
      )
    },
    [
      billingAddress,
      billingAddressSameAsShipping,
      shippingAddress,
      email,
      handlePaymentSuccess,
      initiatePayment.mutate,
    ],
  )

  // Show loading skeleton while cart is loading
  if (isLoading) {
    return <CheckoutSkeleton />
  }

  // Show empty cart message
  if (cartIsEmpty) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-lg mb-4">Your cart is empty.</p>
          <Button asChild>
            <Link href="/shop">Continue shopping</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full grid lg:grid-cols-5 gap-8">
      {/* Left Column - Forms */}
      <div className="lg:col-span-3 space-y-6">
        <ContactInformation
          user={user}
          email={email}
          emailEditable={emailEditable}
          paymentData={paymentData}
          onEmailChange={setEmail}
          onContinueAsGuest={() => setEmailEditable(false)}
        />

        <ShippingInformation
          user={user}
          email={email}
          emailEditable={emailEditable}
          paymentData={paymentData}
          billingAddress={billingAddress}
          shippingAddress={shippingAddress}
          billingAddressSameAsShipping={billingAddressSameAsShipping}
          onBillingAddressChange={setBillingAddress}
          onShippingAddressChange={setShippingAddress}
          onBillingAddressSameAsShippingChange={setBillingAddressSameAsShipping}
        />

        {!paymentData && (
          <Button
            className="w-full"
            size="lg"
            disabled={!canGoToPayment || initiatePayment.isPending}
            onClick={(e) => {
              e.preventDefault()
              void initiatePaymentIntent('paystack')
            }}
          >
            {initiatePayment.isPending ? 'Processing...' : 'Continue to Payment'}
          </Button>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertTitle>{error}</AlertTitle>
              </Alert>
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  router.refresh()
                }}
                variant="outline"
                className="mt-4 w-full"
              >
                Try again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Column - Order Summary */}
      <div className="lg:col-span-2">
        <OrderSummary cart={cart} />
      </div>
    </div>
  )
}
