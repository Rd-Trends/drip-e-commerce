'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { PasswordInput } from '@/components/ui/password-input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useChangePassword } from '@/hooks/use-auth'
import { User } from '@/payload-types'

const passwordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ['passwordConfirm'],
  })

type PasswordFormData = z.infer<typeof passwordSchema>

interface ChangePasswordFormProps {
  user: User
}

export function ChangePasswordForm({ user }: ChangePasswordFormProps) {
  const { mutate: changePassword, isPending: isChangingPassword } = useChangePassword()

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      passwordConfirm: '',
    },
  })

  function onSubmit(data: PasswordFormData) {
    changePassword(
      { userID: user.id, password: data.password },
      {
        onSuccess: () => {
          toast.success('Password changed successfully')
          form.reset()
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to change password')
        },
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>Update your password to keep your account secure.</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <FieldGroup>
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="password">New Password</FieldLabel>
                  <PasswordInput id="password" {...field} />
                  {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                </Field>
              )}
            />
          </FieldGroup>
          <FieldGroup>
            <Controller
              name="passwordConfirm"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="passwordConfirm">Confirm New Password</FieldLabel>
                  <PasswordInput id="passwordConfirm" {...field} />
                  {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                </Field>
              )}
            />
          </FieldGroup>
        </CardContent>
        <CardFooter className="pt-6">
          <Button type="submit" disabled={isChangingPassword}>
            {isChangingPassword ? 'Changing Password...' : 'Change Password'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
