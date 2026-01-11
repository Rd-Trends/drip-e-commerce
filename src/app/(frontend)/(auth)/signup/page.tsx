import { SignupForm } from '../_components/signup-form'
import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { AuthLayout } from '../_components/auth-layout'

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create a new account',
  openGraph: {
    title: 'Sign Up',
    url: '/signup',
  },
}

export default async function SignupPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (user) {
    redirect(`/account?warning=${encodeURIComponent('You are already logged in.')}`)
  }

  return (
    <AuthLayout
      title="Create an account"
      description="Join us to enjoy exclusive offers and faster checkout."
    >
      <SignupForm />
    </AuthLayout>
  )
}
