import { LoginForm } from '../_components/login-form'
import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/logo'
import { QueryToastListener } from '@/components/query-toast-listener'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your account',
  openGraph: {
    title: 'Login',
    url: '/login',
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <QueryToastListener />
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-2 mb-6">
          <Logo />

          <h1 className="text-xl font-bold tracking-tight">Welcome back</h1>

          <p className="text-muted-foreground text-sm leading-relaxed">
            Please enter your details to sign in.
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  )
}
