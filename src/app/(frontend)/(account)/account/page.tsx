import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/account/profile-form'
import { ChangePasswordForm } from '@/components/account/change-password-form'
import { RecentOrders, RecentOrdersSkeleton } from '@/components/account/recent-orders'
import { Suspense } from 'react'

export default async function AccountPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect(
      `/login?warning=${encodeURIComponent('Please login to access your account settings.')}`,
    )
  }

  return (
    <div className="space-y-6">
      <ProfileForm user={user} />
      <ChangePasswordForm user={user} />
      <Suspense fallback={<RecentOrdersSkeleton />}>
        <RecentOrders user={user} />
      </Suspense>
    </div>
  )
}
