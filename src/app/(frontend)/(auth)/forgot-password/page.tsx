'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/logo'
import { useForgotPassword } from '@/hooks/use-auth-mutations'

const forgotPasswordSchema = z.object({
  email: z.email('Please enter a valid email address.'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = React.useState(false)
  const { mutate: forgotPassword, isPending } = useForgotPassword()

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  function onSubmit(data: ForgotPasswordFormData) {
    forgotPassword(data.email, {
      onSuccess: () => {
        setEmailSent(true)
        toast.success('Password reset email sent! Check your inbox.')
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to send reset email. Please try again.')
      },
    })
  }

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="flex flex-col gap-2 mb-6">
            <Logo />

            <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>

            <p className="text-muted-foreground text-sm leading-relaxed">
              We've sent a password reset link to <strong>{form.getValues('email')}</strong>. Please
              check your inbox and follow the instructions to reset your password.
            </p>
          </div>

          {/* Back to Login */}
          <Link href="/login">
            <Button className="h-11 w-full rounded-full font-medium">Back to Login</Button>
          </Link>

          {/* Resend Link */}
          <div className="mt-6">
            <p className="text-muted-foreground text-sm">
              Didn't receive the email?{' '}
              <button
                type="button"
                onClick={() => setEmailSent(false)}
                className="text-foreground font-medium underline hover:text-foreground/80"
              >
                Try again
              </button>
              .
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-2 mb-6">
          <Logo />

          <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>

          <p className="text-muted-foreground text-sm leading-relaxed">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="forgot-email" required>
                    Email
                  </FieldLabel>
                  <Input
                    {...field}
                    id="forgot-email"
                    type="email"
                    aria-invalid={fieldState.invalid}
                    placeholder="Email"
                    autoComplete="email"
                    disabled={isPending}
                    className="h-11"
                  />
                  <FieldDescription>
                    We'll send a password reset link to this email address.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          {/* Submit Button */}
          <Button
            type="submit"
            className="h-11 w-full rounded-full font-medium"
            disabled={isPending}
          >
            {isPending ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Remember your password?{' '}
            <Link
              href="/login"
              className="text-foreground font-medium underline hover:text-foreground/80"
            >
              Sign In
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
