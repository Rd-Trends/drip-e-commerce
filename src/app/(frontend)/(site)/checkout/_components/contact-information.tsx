'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User } from '@/payload-types'
import Link from 'next/link'
import React from 'react'

interface ContactInformationProps {
  user: User | null
  email: string
  emailEditable: boolean
  paymentData: Record<string, unknown> | null
  onEmailChange: (email: string) => void
  onContinueAsGuest: () => void
}

export const ContactInformation: React.FC<ContactInformationProps> = ({
  user,
  email,
  emailEditable,
  paymentData,
  onEmailChange,
  onContinueAsGuest,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
        <CardDescription>
          {user
            ? 'Your account details'
            : 'You are currently checking out as a guest. Please enter your email address below so that we can send you confirmation of your order.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!user && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm">
            <span className="text-muted-foreground">Already have an account?</span>
            <Button asChild variant="link" className="h-auto p-0 text-foreground">
              <Link href="/login">Log in</Link>
            </Button>
            <span className="text-muted-foreground">or</span>
            <Button asChild variant="link" className="h-auto p-0 text-foreground">
              <Link href="/create-account">create an account</Link>
            </Button>
          </div>
        )}

        {user ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="font-medium">{user.email}</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/logout">Log out</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              disabled={!emailEditable || Boolean(paymentData)}
              id="email"
              name="email"
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
            {emailEditable && email && !paymentData && (
              <Button onClick={onContinueAsGuest} className="w-full">
                Continue as guest
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
