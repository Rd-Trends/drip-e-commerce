import { ResetPasswordForm } from '../_components/reset-password-form'
import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Create a new password',
  openGraph: {
    title: 'Reset Password',
    url: '/reset-password',
  },
}

export default async function ResetPasswordPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (user) {
    redirect(`/account?warning=${encodeURIComponent('You are already logged in.')}`)
  }

  return <ResetPasswordForm />
}
