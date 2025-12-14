'use client'

import Link from 'next/link'
import { LogIn, UserPlus, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { UserProfileDropdownMenu } from '../customer-profile-dropdown'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/providers/auth'
import { getUserInitials } from '@/utils/get-user-initials'

interface MobileUserMenuProps {
  onMenuClose: () => void
}

export function MobileUserMenu({ onMenuClose }: MobileUserMenuProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="space-y-3 pt-4">
        <Separator />
        <div className="space-y-2">
          <div className="h-10 bg-muted animate-pulse rounded" />
          <div className="h-10 bg-muted animate-pulse rounded" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-3 pt-4">
        <Separator />
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/auth/login" onClick={onMenuClose}>
              <LogIn className="mr-2 h-4 w-4" />
              Sign in
            </Link>
          </Button>
          <Button className="w-full justify-start" asChild>
            <Link href="/auth/signup" onClick={onMenuClose}>
              <UserPlus className="mr-2 h-4 w-4" />
              Sign up
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <UserProfileDropdownMenu user={user}>
      <Button
        size="lg"
        variant={'ghost'}
        className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
      >
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarFallback className="rounded-lg">{getUserInitials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left text-sm leading-tight">
          {user?.name && <span className="truncate font-medium">{user.name}</span>}
          <span className="truncate text-xs">{user.email}</span>
        </div>
        <ChevronsUpDown className="ml-auto size-4" />
      </Button>
    </UserProfileDropdownMenu>
  )
}
