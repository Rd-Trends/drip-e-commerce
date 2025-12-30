'use client'

import React from 'react'
import { Button, LinkButton } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { UserProfileDropdownMenu } from '../customer-profile-dropdown'
import { useAuth } from '@/providers/auth'
import { getUserInitials } from '@/utils/get-user-initials'
import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

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
        <LinkButton href="/login" variant="ghost" size="sm">
          Sign in
        </LinkButton>
        <LinkButton href="/signup" size="sm">
          Sign up
        </LinkButton>
      </div>
    )
  }

  return (
    <UserProfileDropdownMenu user={user}>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="relative h-8 w-8 rounded-full hidden md:inline-flex" />
        }
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getUserInitials(user.name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
    </UserProfileDropdownMenu>
  )
}
