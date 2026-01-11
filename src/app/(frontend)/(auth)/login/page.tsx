import { LoginForm } from '../_components/login-form'
import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import { QueryToastListener } from '@/components/query-toast-listener'
import { Metadata } from 'next'
import { AuthLayout } from '../_components/auth-layout'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your account',
  openGraph: {
    title: 'Login',
    url: '/login',
  },
  alternates: {
    canonical: '/login',
  },
}

export default async function LoginPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (user) {
    redirect(`/account?warning=${encodeURIComponent('You are already logged in.')}`)
  }

  return (
    <AuthLayout title="Welcome back" description="Please enter your details to sign in.">
      <QueryToastListener />
      <LoginForm />
    </AuthLayout>
  )
}
