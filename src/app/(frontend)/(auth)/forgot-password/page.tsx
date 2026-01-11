import { ForgotPasswordForm } from '../_components/forgot-password-form'
import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your password',
  openGraph: {
    title: 'Forgot Password',
    url: '/forgot-password',
  },
  alternates: {
    canonical: '/forgot-password',
  },
}

export default async function ForgotPasswordPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (user) {
    redirect(`/account?warning=${encodeURIComponent('You are already logged in.')}`)
  }

  return <ForgotPasswordForm />
}
