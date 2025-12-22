'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/logo'
import { useLogin } from '@/hooks/use-auth-mutations'
import { PasswordInput } from '@/components/ui/password-input'

const loginSchema = z.object({
  email: z.email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { mutate: login, isPending } = useLogin()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  function onSubmit(data: LoginFormData) {
    login(data, {
      onSuccess: () => {
        toast.success('Welcome back!')
        router.push('/shop')
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to login. Please try again.')
      },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-2 mb-6">
          <Logo />

          <h1 className="text-2xl font-bold tracking-tight">
            Enter your email to join us or sign in.
          </h1>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="login-email" required>
                    Email
                  </FieldLabel>
                  <Input
                    {...field}
                    id="login-email"
                    type="email"
                    aria-invalid={fieldState.invalid}
                    placeholder="Email"
                    autoComplete="email"
                    disabled={isPending}
                    className="h-11"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="login-password" required>
                      Password
                    </FieldLabel>
                    <Link
                      href="/forgot-password"
                      className="text-muted-foreground hover:text-foreground text-xs underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <PasswordInput
                    {...field}
                    id="login-password"
                    aria-invalid={fieldState.invalid}
                    placeholder="Password"
                    autoComplete="current-password"
                    disabled={isPending}
                    className="h-11"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          {/* Privacy Policy */}
          <p className="text-muted-foreground text-center text-xs leading-relaxed">
            By continuing, I agree to Drip's{' '}
            <Link href="/privacy-policy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="/terms-of-use" className="underline hover:text-foreground">
              Terms of Use
            </Link>
            .
          </p>

          {/* Submit Button */}
          <Button
            type="submit"
            className="h-11 w-full rounded-full font-medium"
            disabled={isPending}
          >
            {isPending ? 'Signing in...' : 'Continue'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Not a member?{' '}
            <Link
              href="/signup"
              className="text-foreground font-medium underline hover:text-foreground/80"
            >
              Join Us
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
