'use client'

import { Fragment } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'
import { useRouter } from 'next/navigation'

import { Button, LinkButton } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useLogin } from '@/hooks/use-auth'
import { PasswordInput } from '@/components/ui/password-input'
import { useQueryState } from 'nuqs'

const loginSchema = z.object({
  email: z.email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const [redirectURI] = useQueryState('redirect', { defaultValue: '/' })
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
        router.push(redirectURI)
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to login. Please try again.')
      },
    })
  }

  return (
    <Fragment>
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
                  <LinkButton
                    href="/forgot-password"
                    variant="link"
                    size="xs"
                    className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  >
                    Forgot password?
                  </LinkButton>
                </div>
                <PasswordInput
                  {...field}
                  id="login-password"
                  aria-invalid={fieldState.invalid}
                  placeholder="Password"
                  autoComplete="current-password"
                  disabled={isPending}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        {/* Privacy Policy */}
        <p className="text-muted-foreground text-center text-xs leading-relaxed">
          By continuing, I agree to Drip&apos;s{' '}
          <LinkButton href="/privacy-policy" variant="link" className="h-auto p-0 text-xs">
            Privacy Policy
          </LinkButton>{' '}
          and{' '}
          <LinkButton href="/terms-of-use" variant="link" className="h-auto p-0 text-xs">
            Terms of Use
          </LinkButton>
          .
        </p>

        {/* Submit Button */}
        <Button type="submit" className="w-full rounded-full font-medium" disabled={isPending}>
          {isPending ? 'Signing in...' : 'Continue'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-muted-foreground text-sm">
          Not a member?{' '}
          <LinkButton
            href={`/signup?redirect=${encodeURIComponent(redirectURI)}`}
            variant="link"
            className="h-auto p-0 text-sm font-medium"
          >
            Join Us
          </LinkButton>
          .
        </p>
      </div>
    </Fragment>
  )
}
