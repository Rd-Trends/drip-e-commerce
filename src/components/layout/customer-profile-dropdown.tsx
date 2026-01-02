'use client'

import { UserIcon, Settings, ShoppingBag, LogOutIcon } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { User } from '@/payload-types'
import { useLogout } from '@/hooks/use-auth'
import Link from 'next/link'
import { getUserInitials } from '@/utils/get-user-initials'

export function UserProfileDropdownMenu({
  user,
  children,
}: {
  user: User
  children: React.ReactNode
}) {
  const router = useRouter()
  const { mutate, isPending } = useLogout()

  const handleLogout = async () => {
    // startTransition(async () => {
    //   const { data } = await logoutAction()
    //   if (data?.success) {
    //     setuser(null)
    //     router.refresh()
    //   } else {
    //     toast.error('Failed to log out')
    //   }
    // })
    mutate(void 0, {
      onSuccess: () => {
        router.refresh()
        toast.success('Logged out successfully')
      },
      onError: () => {
        toast.error('Failed to log out')
      },
    })
  }

  return (
    <DropdownMenu>
      {children}
      <DropdownMenuContent
        className="w-(--anchor-width) min-w-56 rounded-lg"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                {user?.name && <span className="truncate font-medium">{user.name}</span>}
                <span className="truncate text-xs">{user.email}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            render={
              <Link href="/account" className="flex items-center">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            }
          />
          <DropdownMenuItem
            render={
              <Link href="/account/orders" className="flex items-center">
                <ShoppingBag className="mr-2 h-4 w-4" />
                <span>Orders</span>
              </Link>
            }
          />
          <DropdownMenuItem
            render={
              <Link href="/account/settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            }
          />
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={(e) => {
              e.preventDefault()
              handleLogout()
            }}
          >
            <LogOutIcon className="mr-2 h-4 w-4 " />
            {isPending ? 'Logging out...' : 'Log out'}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
