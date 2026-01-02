'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLogout } from '@/hooks/use-auth'

export function LogoutSection() {
  const router = useRouter()
  const { mutate: logout, isPending } = useLogout()

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        toast.success('Logged out successfully')
        router.push('/')
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to logout. Please try again.')
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logout</CardTitle>
        <CardDescription>
          Sign out of your account. You&apos;ll need to log in again to access your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="destructive"
          onClick={handleLogout}
          disabled={isPending}
          className="w-full sm:w-auto"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isPending ? 'Logging out...' : 'Logout'}
        </Button>
      </CardContent>
    </Card>
  )
}
