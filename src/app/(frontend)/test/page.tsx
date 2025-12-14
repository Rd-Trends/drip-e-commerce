'use client'

import { Button } from '@/components/ui/button'
import { useMutation } from '@tanstack/react-query'

const data = {
  cartID: 1,
  cartSecret: '26c68611108ed19cc759d00eac025c259e23a8df',
  currency: 'NGN',
  customerEmail: 'daniel@gmail.com',
  billingAddress: {
    title: 'Mr.',
    firstName: 'Daniel',
    lastName: 'Ikoyo',
    phone: '+2348161827754',
    addressLine1: 'Behind Dantinajo Gold Resort',
    city: 'Oleh',
    state: 'Delta',
    postalCode: '334101',
    country: 'US',
  },
  shippingAddress: {
    title: 'Mr.',
    firstName: 'Daniel',
    lastName: 'Ikoyo',
    phone: '+2348161827754',
    addressLine1: 'Behind Dantinajo Gold Resort',
    city: 'Oleh',
    state: 'Delta',
    postalCode: '334101',
    country: 'US',
  },
}

export default function TestPage() {
  const mutation = useMutation({
    mutationFn: async () => {
      const fetchURL = `/api/payments/paystack/initiate?secret=${data.cartSecret}`
      try {
        const response = await fetch(fetchURL, {
          body: JSON.stringify({
            ...data,
          }),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        if (!response.ok) {
          const responseError = await response.text()
          throw new Error(responseError)
        }

        const responseData = await response.json()

        if (responseData.error) {
          throw new Error(responseData.error)
        }

        return responseData
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to initiate payment')
      }
    },
  })
  return (
    <Button onClick={() => mutation.mutate()}>
      {mutation.isPending ? 'Processing...' : 'Initiate Payment'}
    </Button>
  )
}
