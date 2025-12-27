'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { useAuth } from '@/providers/auth'
import { useCart } from '@/providers/cart'
import { useDeleteCart } from '@/hooks/use-cart-queries'
import { useConfirmOrder, useInitiatePayment } from '@/hooks/use-payment'
import { useShippingConfig } from '@/hooks/use-shipping-config'
import { Address } from '@/payload-types'
import { calculateShippingFee } from '@/utils/calculate-shipping'
import { calculateTax } from '@/utils/calculate-tax'
import { AlertCircleIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CheckoutSkeleton } from './checkout-skeleton'
import { ContactInformation } from './contact-information'
import { OrderSummary } from './order-summary'
import { ShippingInformation } from './shipping-information'
import { Price } from '@/components/price'
import { useAddresses } from '@/hooks/use-address'

type AppliedCoupon = {
  id: number
  code: string
  type: 'percentage' | 'fixed'
  value: number
  discount: number
}

export const CheckoutPage: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const { cart, isLoading } = useCart()
  const { data: addresses } = useAddresses()
  const { mutate: clearCart } = useDeleteCart()
  const initiatePayment = useInitiatePayment()
  const confirmOrder = useConfirmOrder()
  const { data: shippingConfig, isLoading: shippingConfigLoading } = useShippingConfig()

  const [error, setError] = useState<null | string>(null)
  const [email, setEmail] = useState('')
  const [emailEditable, setEmailEditable] = useState(true)
  const [paymentData, setPaymentData] = useState<null | Record<string, unknown>>(null)
  const [shippingAddress, setShippingAddress] = useState<Partial<Address>>()
  const [billingAddress, setBillingAddress] = useState<Partial<Address>>()
  const [billingAddressSameAsShipping, setBillingAddressSameAsShipping] = useState(true)
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)

  const cartIsEmpty = !cart || !cart.items || !cart.items.length
  const canGoToPayment = Boolean(
    (email || user) && billingAddress && (billingAddressSameAsShipping || shippingAddress),
  )

  // Calculate shipping and tax
  const shippingState = billingAddressSameAsShipping
    ? billingAddress?.state
    : shippingAddress?.state

  const shippingCalculation = React.useMemo(() => {
    if (!shippingConfig || !cart?.subtotal || !shippingState) return null

    return calculateShippingFee(shippingState, cart.subtotal, shippingConfig)
  }, [shippingConfig, shippingState, cart?.subtotal])

  const discountedAmount = React.useMemo(() => {
    if (!cart?.subtotal) return 0
    return cart.subtotal - (appliedCoupon ? appliedCoupon.discount : 0)
  }, [cart?.subtotal, appliedCoupon?.discount])

  const taxAmount = React.useMemo(() => {
    if (!shippingConfig) return 0
    return calculateTax(discountedAmount, shippingConfig.taxRate || 7.5)
  }, [shippingConfig, discountedAmount])

  const totalAmount = React.useMemo(() => {
    const shipping = shippingCalculation?.fee || 0
    return discountedAmount + shipping + taxAmount
  }, [discountedAmount, shippingCalculation?.fee, taxAmount])

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
  }, [addresses, shippingAddress])

  useEffect(() => {
    return () => {
      setShippingAddress(undefined)
      setBillingAddress(undefined)
      setBillingAddressSameAsShipping(true)
      setEmail('')
      setEmailEditable(true)
      setAppliedCoupon(null)
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
            ...(appliedCoupon && { couponId: appliedCoupon.id }),
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
      appliedCoupon,
      handlePaymentSuccess,
      initiatePayment.mutate,
    ],
  )

  // Show loading skeleton while cart or shipping config is loading
  if (isLoading || shippingConfigLoading) {
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
    <div className="w-full grid lg:grid-cols-2 gap-8">
      {/* Left Column - Forms */}
      <div className="lg:col-span-1 space-y-6">
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

        {error && (
          <Card className="border-destructive">
            <CardContent>
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
      <div className="lg:col-span-1">
        <OrderSummary
          cart={cart}
          shippingFee={shippingCalculation?.fee}
          shippingIsFree={shippingCalculation?.isFree}
          taxAmount={taxAmount}
          totalAmount={totalAmount}
          appliedCoupon={appliedCoupon}
          onCouponApplied={setAppliedCoupon}
          onCouponRemoved={() => setAppliedCoupon(null)}
          disabled={Boolean(paymentData)}
        >
          {!paymentData && (
            <Button
              className="w-full"
              size="lg"
              disabled={initiatePayment.isPending}
              onClick={(e) => {
                e.preventDefault()
                if (!canGoToPayment) {
                  let errorMessage = 'Please complete all required information to continue.'

                  if (!email && !user) {
                    errorMessage = 'Please add an email address to continue.'
                  } else if (!shippingAddress) {
                    errorMessage = 'Please add shipping address details to continue.'
                  } else if (!billingAddress) {
                    errorMessage = 'Please add billing address details to continue.'
                  }

                  toast.error(errorMessage)
                  return
                }

                void initiatePaymentIntent('paystack')
              }}
            >
              {initiatePayment.isPending ? (
                'Processing...'
              ) : (
                <>
                  Pay <Price as="span" amount={totalAmount} />
                </>
              )}
            </Button>
          )}
        </OrderSummary>
      </div>
    </div>
  )
}
