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
import { useCreateUser } from '@/hooks/use-auth-mutations'
import { PasswordInput } from '@/components/ui/password-input'

const signupSchema = z
  .object({
    email: z.email('Please enter a valid email address.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ['passwordConfirm'],
  })

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const { mutate: createUser, isPending } = useCreateUser()

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      passwordConfirm: '',
    },
  })

  function onSubmit(data: SignupFormData) {
    createUser(data, {
      onSuccess: () => {
        toast.success('Account created successfully!')
        router.push('/shop')
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to create account. Please try again.')
      },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-2 mb-6">
          <Logo />

          <h1 className="text-2xl font-bold tracking-tight">Become a Drip Member</h1>

          <p className="text-muted-foreground text-sm leading-relaxed">
            Create your Drip Member profile, and get access to an enhanced shopping experience.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="signup-email" required>
                    Email
                  </FieldLabel>
                  <Input
                    {...field}
                    id="signup-email"
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
                  <FieldLabel htmlFor="signup-password" required>
                    Password
                  </FieldLabel>
                  <PasswordInput
                    {...field}
                    id="signup-password"
                    aria-invalid={fieldState.invalid}
                    placeholder="Password"
                    autoComplete="new-password"
                    disabled={isPending}
                    className="h-11"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="passwordConfirm"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="signup-password-confirm" required>
                    Confirm Password
                  </FieldLabel>
                  <PasswordInput
                    {...field}
                    id="signup-password-confirm"
                    aria-invalid={fieldState.invalid}
                    placeholder="Confirm Password"
                    autoComplete="new-password"
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
            By creating an account, you agree to Drip's{' '}
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
          <Button type="submit" className="h-11 w-full font-medium" disabled={isPending}>
            {isPending ? 'Creating account...' : 'Join Us'}
          </Button>
        </form>

        {/* Sign In Link */}
        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Already a member?{' '}
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
