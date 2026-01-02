'use client'

import { Fragment } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useCreateUser } from '@/hooks/use-auth'
import { PasswordInput } from '@/components/ui/password-input'
import { useQueryState } from 'nuqs'

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters.'),
    email: z.email('Please enter a valid email address.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ['passwordConfirm'],
  })

type SignupFormData = z.infer<typeof signupSchema>

export function SignupForm() {
  const router = useRouter()
  const [redirectURI] = useQueryState('redirect', { defaultValue: '/' })
  const createUser = useCreateUser()

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      passwordConfirm: '',
    },
  })

  function onSubmit(data: SignupFormData) {
    createUser.mutate(data, {
      onSuccess: () => {
        toast.success('Account created successfully!')
        router.push(redirectURI)
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to create account. Please try again.')
      },
    })
  }

  return (
    <Fragment>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="signup-name" required>
                  Full Name
                </FieldLabel>
                <Input
                  {...field}
                  id="signup-name"
                  aria-invalid={fieldState.invalid}
                  placeholder="Full Name"
                  autoComplete="name"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
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
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        {/* Privacy Policy */}
        <p className="text-muted-foreground text-center text-xs leading-relaxed">
          By creating an account, you agree to Drip&apos;s{' '}
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
        <Button type="submit" className="h-11 w-full font-medium" disabled={createUser.isPending}>
          {createUser.isPending ? 'Creating account...' : 'Join Us'}
        </Button>
      </form>

      {/* Sign In Link */}
      <div className="mt-6 text-center">
        <p className="text-muted-foreground text-sm">
          Already a member?{' '}
          <Link
            href={`/login?redirect=${encodeURIComponent(redirectURI)}`}
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
