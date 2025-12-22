'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Logo } from '@/components/logo'
import { useResetPassword } from '@/hooks/use-auth'
import { PasswordInput } from '@/components/ui/password-input'

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ['passwordConfirm'],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const { mutate: resetPassword, isPending } = useResetPassword()

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      passwordConfirm: '',
    },
  })

  function onSubmit(data: ResetPasswordFormData) {
    if (!token) {
      toast.error('Invalid reset token. Please request a new password reset link.')
      return
    }

    resetPassword(
      { ...data, token },
      {
        onSuccess: () => {
          toast.success('Password reset successfully! You can now login.')
          router.push('/login')
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to reset password. Please try again.')
        },
      },
    )
  }

  // Show error if no token
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="flex flex-col gap-2 mb-6">
            <Logo />

            <h1 className="text-2xl font-bold tracking-tight">Invalid Reset Link</h1>

            <p className="text-muted-foreground text-sm leading-relaxed">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
          </div>{' '}
          {/* Request New Link */}
          <Link href="/forgot-password">
            <Button className="h-11 w-full rounded-full font-medium">Request New Link</Button>
          </Link>
          {/* Back to Login */}
          <div className="mt-6">
            <p className="text-muted-foreground text-sm">
              <Link
                href="/login"
                className="text-foreground font-medium underline hover:text-foreground/80"
              >
                Back to Login
              </Link>
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

          <h1 className="text-2xl font-bold tracking-tight">Create a new password</h1>

          <p className="text-muted-foreground text-sm leading-relaxed">
            Enter your new password below. Make sure it's at least 6 characters long.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup>
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="reset-password" required>
                    New Password
                  </FieldLabel>
                  <PasswordInput
                    {...field}
                    id="reset-password"
                    aria-invalid={fieldState.invalid}
                    placeholder="New Password"
                    autoComplete="new-password"
                    disabled={isPending}
                    className="h-11"
                  />
                  <FieldDescription>Must be at least 6 characters long.</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="passwordConfirm"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="reset-password-confirm" required>
                    Confirm New Password
                  </FieldLabel>
                  <PasswordInput
                    {...field}
                    id="reset-password-confirm"
                    aria-invalid={fieldState.invalid}
                    placeholder="Confirm New Password"
                    autoComplete="new-password"
                    disabled={isPending}
                    className="h-11"
                  />
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
            {isPending ? 'Resetting password...' : 'Reset Password'}
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
