'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'
import { useRouter } from 'next/navigation'

import { Button, LinkButton } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { useResetPassword } from '@/hooks/use-auth'
import { PasswordInput } from '@/components/ui/password-input'
import { useQueryState } from 'nuqs'
import { AuthLayout } from './auth-layout'

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

export function ResetPasswordForm() {
  const router = useRouter()
  const [token] = useQueryState('token')

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
          toast.success('Password reset successfully! Redirecting to home page.')
          router.push('/')
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
      <AuthLayout
        title="Invalid Reset Link"
        description="This password reset link is invalid or has expired. Please request a new one."
      >
        {/* Request New Link */}
        <LinkButton href="/forgot-password" className="w-full rounded-full font-medium">
          Request New Link
        </LinkButton>
        {/* Back to Login */}
        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            <LinkButton href="/login" variant="link" className="h-auto p-0 text-sm font-medium">
              Back to Login
            </LinkButton>
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create a new password"
      description="Enter your new password below. Make sure it's at least 6 characters long."
    >
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
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        {/* Submit Button */}
        <Button type="submit" className="w-full rounded-full font-medium" disabled={isPending}>
          {isPending ? 'Resetting password...' : 'Reset Password'}
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
