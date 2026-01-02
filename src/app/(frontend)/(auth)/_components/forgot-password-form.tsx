'use client'

import { Fragment, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useForgotPassword } from '@/hooks/use-auth'

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
      <Fragment>
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-xl font-bold tracking-tight">Check your email</h1>

          <p className="text-muted-foreground text-sm leading-relaxed">
            We&apos;ve sent a password reset link to <strong>{form.getValues('email')}</strong>.
            Please check your inbox and follow the instructions to reset your password.
          </p>
        </div>

        {/* Back to Login */}
        <Link href="/login">
          <Button className="h-11 w-full rounded-full font-medium">Back to Login</Button>
        </Link>

        {/* Resend Link */}
        <div className="mt-6">
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
      </Fragment>
    )
  }

  return (
    <Fragment>
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-xl font-bold tracking-tight">Reset your password</h1>

        <p className="text-muted-foreground text-sm leading-relaxed">
          Enter your email address and we&apos;ll send you a link to reset your password.
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
        <Button type="submit" className="h-11 w-full rounded-full font-medium" disabled={isPending}>
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
    </Fragment>
  )
}
