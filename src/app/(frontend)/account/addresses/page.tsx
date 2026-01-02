import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utils/merge-open-graph'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import { AddressListing } from '@/components/addresses/address-listing'
import { CreateAddressModal } from '@/components/addresses/create-address-modal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AddressesPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent('/account/addresses')}&warning=${encodeURIComponent('Please login to access your account settings.')}`,
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Addresses</CardTitle>
          <CardDescription>Manage your shipping and billing addresses.</CardDescription>
        </div>
        <CreateAddressModal />
      </CardHeader>
      <CardContent>
        <AddressListing />
      </CardContent>
    </Card>
  )
}

export const metadata: Metadata = {
  title: 'Manage Addresses',
  description:
    'Manage your shipping and billing addresses for faster checkout. Add, edit, or remove delivery locations.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: mergeOpenGraph({
    title: 'Manage Addresses',
    url: '/account/addresses',
  }),
}
