'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { UserProfileDropdownMenu } from '../customer-profile-dropdown'
import { useAuth } from '@/providers/auth'
import { getUserInitials } from '@/utils/get-user-initials'

export function CustomerProfile() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="hidden md:flex items-center gap-2">
        <div className="h-8 w-16 bg-muted animate-pulse rounded" />
        <div className="h-8 w-16 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="hidden md:flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/auth/signup">Sign up</Link>
        </Button>
      </div>
    )
  }

  return (
    <UserProfileDropdownMenu user={user}>
      <Button variant="ghost" className="relative h-8 w-8 rounded-full hidden md:inline-flex">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getUserInitials(user.name)}
          </AvatarFallback>
        </Avatar>
      </Button>
    </UserProfileDropdownMenu>
  )
}
