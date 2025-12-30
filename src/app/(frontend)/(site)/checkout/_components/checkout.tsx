'use client'

import { Button, LinkButton } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/providers/auth'
import { useCart } from '@/providers/cart'
import { useDeleteCart } from '@/hooks/use-cart-queries'
import { useConfirmOrder, useInitiatePayment } from '@/hooks/use-payment'
import { useShippingConfig } from '@/hooks/use-shipping-config'
import { Address, Cart, ShippingConfig } from '@/payload-types'
import { calculateShippingFee } from '@/utils/calculate-shipping'
import { calculateTax } from '@/utils/calculate-tax'
import { CheckCircleIcon, Loader2 } from 'lucide-react'
import React, { Fragment, useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CheckoutSkeleton } from './checkout-skeleton'
import { ContactInformation } from './contact-information'
import { OrderSummary } from './order-summary'
import { ShippingInformation } from './shipping-information'
import { Price } from '@/components/price'
import { useAddresses } from '@/hooks/use-address'
import Link from 'next/link'

type AppliedCoupon = {
  id: number
  code: string
  type: 'percentage' | 'fixed'
  value: number
  discount: number
}

export function CheckoutPage() {
  const { cart, isLoading: cartLoading } = useCart()
  const { data: shippingConfig, isLoading: shippingConfigLoading } = useShippingConfig()
  const { data: addresses, isLoading: addressesLoading } = useAddresses()

  const [isConfirmingOrder, setIsConfirmingOrder] = useState(false)

  const isLoading = cartLoading || shippingConfigLoading || addressesLoading
  const cartIsEmpty = !cart || !cart.items || !cart.items.length

  if (isLoading) {
    return <CheckoutSkeleton />
  }

  if (cartIsEmpty && !isConfirmingOrder) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-lg mb-4">Your cart is empty.</p>
          <LinkButton href="/shop">Continue shopping</LinkButton>
        </CardContent>
      </Card>
    )
  }

  return (
    <CheckoutForm
      cart={cart}
      shippingConfig={shippingConfig}
      addresses={addresses}
      onConfirmingOrder={() => setIsConfirmingOrder(true)}
    />
  )
}

function CheckoutForm({
  cart,
  shippingConfig,
  addresses,
}: {
  cart?: Cart
  shippingConfig?: ShippingConfig
  addresses?: Address[]
  onConfirmingOrder: () => void
}) {
  const { user } = useAuth()
  const { mutate: clearCart } = useDeleteCart()
  const { mutate: initiatePayment, isPending: isInitiatingPayment } = useInitiatePayment()
  const { mutate: confirmOrder } = useConfirmOrder()

  const [email, setEmail] = useState('')
  const [emailEditable, setEmailEditable] = useState(true)
  const [paymentData, setPaymentData] = useState<Record<string, unknown> | null>(null)
  const [shippingAddress, setShippingAddress] = useState<Partial<Address> | undefined>(
    addresses?.[0],
  )
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [orderID, setOrderID] = useState<number | null>(null)
  const [showIsConfirmingOrder, setShowIsConfirmingOrder] = useState(false)

  const canGoToPayment = Boolean((email || user) && shippingAddress)

  // Calculate shipping and tax
  const shippingState = shippingAddress?.state

  const shippingCalculation = useMemo(() => {
    if (!shippingConfig || !cart?.subtotal || !shippingState) return null
    return calculateShippingFee(shippingState, cart.subtotal, shippingConfig)
  }, [shippingConfig, shippingState, cart?.subtotal])

  const discountedAmount = useMemo(() => {
    if (!cart?.subtotal) return 0
    return cart.subtotal - (appliedCoupon?.discount || 0)
  }, [cart?.subtotal, appliedCoupon?.discount])

  const taxAmount = useMemo(() => {
    if (!shippingConfig) return 0
    return calculateTax(discountedAmount, shippingConfig.taxRate || 7.5)
  }, [shippingConfig, discountedAmount])

  const totalAmount = useMemo(() => {
    const shipping = shippingCalculation?.fee || 0
    return discountedAmount + shipping + taxAmount
  }, [discountedAmount, shippingCalculation?.fee, taxAmount])

  const handlePaymentSuccess = useCallback(
    (reference: string) => {
      setShowIsConfirmingOrder(true)
      confirmOrder(
        {
          paymentMethodID: 'paystack',
          additionalData: {
            reference,
            ...(email ? { customerEmail: email } : {}),
          },
        },
        {
          onSuccess: (confirmResult) => {
            if (confirmResult.orderID) {
              setOrderID(confirmResult.orderID)
              clearCart()
            }
          },
          onError: () => {
            toast.error('An error occurred while confirming your order. Please contact support.')
          },
        },
      )
    },
    [clearCart, confirmOrder, email],
  )

  const initiatePaymentIntent = useCallback(
    async (paymentID: string) => {
      initiatePayment(
        {
          paymentMethodID: paymentID,
          additionalData: {
            ...(email ? { customerEmail: email } : {}),
            shippingAddress,
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
                },
                onCancel: () => {
                  toast.error('Payment was cancelled.')
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

            toast.error(errorMessage)
          },
        },
      )
    },
    [shippingAddress, email, appliedCoupon, handlePaymentSuccess, initiatePayment],
  )

  const handleCheckout = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    if (!canGoToPayment) {
      let errorMessage = 'Please complete all required information to continue.'

      if (!email && !user) {
        errorMessage = 'Please add an email address to continue.'
      } else if (!shippingAddress) {
        errorMessage = 'Please add shipping address details to continue.'
      }

      toast.error(errorMessage)
      return
    }

    void initiatePaymentIntent('paystack')
  }

  return (
    <Fragment>
      {cart && (
        <Fragment>
          <div className="w-full grid lg:grid-cols-2 gap-8">
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
                shippingAddress={shippingAddress}
                onShippingAddressChange={setShippingAddress}
              />
            </div>

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
                <Button
                  className="w-full"
                  size="lg"
                  disabled={isInitiatingPayment || Boolean(paymentData)}
                  onClick={handleCheckout}
                >
                  {isInitiatingPayment ? (
                    'Processing...'
                  ) : (
                    <>
                      Pay <Price as="span" amount={totalAmount} />
                    </>
                  )}
                </Button>
              </OrderSummary>
            </div>
          </div>
        </Fragment>
      )}

      {orderID && <OrderSuccess orderID={orderID.toString()} email={email} />}

      <Dialog open={showIsConfirmingOrder && !orderID}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-center">Confirming Your Order</DialogTitle>
            <DialogDescription className="text-center">
              Please wait while we confirm your payment and process your order.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    </Fragment>
  )
}

const OrderSuccess = ({ orderID, email }: { orderID: string; email: string }) => {
  const { user } = useAuth()
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircleIcon className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="mt-4 text-2xl font-bold">Payment Successful!</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">
          Thank you for your purchase. Your order has been confirmed and will be processed shortly.
        </p>

        <div className="pt-4 space-y-2">
          <Button className="w-full" render={<Link href="/" />}>
            Continue Shopping
          </Button>

          <Button
            variant="outline"
            className="w-full"
            render={
              <Link
                href={user ? `/account/order/${orderID}` : `/orders/${orderID}?email=${email}`}
              />
            }
          >
            View Order
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
