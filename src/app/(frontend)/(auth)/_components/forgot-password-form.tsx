'use client'

import { Fragment, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { Button, LinkButton } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useForgotPassword } from '@/hooks/use-auth'
import { AuthLayout } from './auth-layout'

const forgotPasswordSchema = z.object({
  email: z.email('Please enter a valid email address.'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const [emailSent, setEmailSent] = useState(false)
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
      <AuthLayout
        title="Check your email"
        description={`We've sent a password reset link to ${form.getValues('email')}. Please check your inbox and follow the instructions to reset your password.`}
      >
        {/* Back to Login */}

        <LinkButton href="/login" className="w-full rounded-full font-medium">
          Back to Login
        </LinkButton>

        {/* Resend Link */}
        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Didn&apos;t receive the email?{' '}
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
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Reset your password" description="Enter your email to receive a reset link.">
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
                />
                <FieldDescription>
                  We&apos;ll send a password reset link to this email address.
                </FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        {/* Submit Button */}
        <Button type="submit" className="w-full rounded-full font-medium" disabled={isPending}>
          {isPending ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>

      {/* Back to Login */}
      <div className="mt-6 text-center">
        <p className="text-muted-foreground text-sm">
          Remember your password?{' '}
          <LinkButton href="/login" variant="link" className="h-auto p-0 text-sm font-medium">
            Sign In
          </LinkButton>
          .
        </p>
      </div>
    </AuthLayout>
  )
}
