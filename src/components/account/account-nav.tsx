'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Package, MapPin } from 'lucide-react'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const items = [
  {
    title: 'Overview',
    href: '/account',
    icon: User,
  },
  {
    title: 'Orders',
    href: '/orders',
    icon: Package,
  },
  {
    title: 'Addresses',
    href: '/account/addresses',
    icon: MapPin,
  },
]

export function AccountNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-4 overflow-x-auto lg:flex-col lg:gap-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            pathname === item.href ? 'bg-muted hover:bg-muted' : 'hover:bg-muted/50',
            'justify-start',
          )}
        >
          <item.icon className="mr-2 h-4 w-4" />
          {item.title}
        </Link>
      ))}
    </nav>
  )
}
