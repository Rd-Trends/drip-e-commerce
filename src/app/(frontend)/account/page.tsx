import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/account/profile-form'
import { ChangePasswordForm } from '@/components/account/change-password-form'
import { RecentOrders, RecentOrdersSkeleton } from '@/components/account/recent-orders'
import { LogoutSection } from '@/components/account/logout-section'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { mergeOpenGraph } from '@/utils/merge-open-graph'
import { QueryToastListener } from '@/components/query-toast-listener'

export const metadata: Metadata = {
  title: 'My Account',
  description:
    'Manage your profile, change password, and view recent orders. Update your account settings and preferences.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: mergeOpenGraph({
    title: 'My Account',
    url: '/account',
  }),
}

export default async function AccountPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent('/account')}&warning=${encodeURIComponent('Please login to access your account settings.')}`,
    )
  }

  return (
    <div className="space-y-6">
      <QueryToastListener />
      <ProfileForm user={user} />
      <ChangePasswordForm user={user} />
      <Suspense fallback={<RecentOrdersSkeleton />}>
        <RecentOrders user={user} />
      </Suspense>
      <LogoutSection />
    </div>
  )
}
