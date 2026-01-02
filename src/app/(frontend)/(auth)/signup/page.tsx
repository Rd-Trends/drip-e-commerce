import { SignupForm } from '../_components/signup-form'
import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/logo'
import { Metadata } from 'next'

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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-2 mb-6">
          <Logo />

          <h1 className="text-xl font-bold tracking-tight">Create an account</h1>

          <p className="text-muted-foreground text-sm leading-relaxed">
            Join us to enjoy exclusive offers and faster checkout.
          </p>
        </div>

        <SignupForm />
      </div>
    </div>
  )
}
