'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NavLink = ({ url, label, className }: { url: string; label: string; className?: string }) => {
  return (
    <Link
      href={url}
      prefetch={true}
      className={cn(
        'text-neutral-500 underline-offset-4 hover:text-black hover:underline dark:text-neutral-400 dark:hover:text-neutral-300',
        className,
      )}
    >
      {label}
    </Link>
  )
}

const ActiveStateNavLink = ({ url, label }: { url: string; label: string }) => {
  const pathname = usePathname()
  const isActive = pathname === url || pathname.startsWith(`${url}/`)

  return (
    <NavLink
      url={url}
      label={label}
      className={isActive ? 'underline text-black dark:text-neutral-300' : ''}
    />
  )
}

export { NavLink, ActiveStateNavLink }
