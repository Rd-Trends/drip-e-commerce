'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ActiveStateNavLink, NavLink } from './nav-link'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Header } from '@/payload-types'

type NavMenuProps = {
  menu: NonNullable<Header['navItems']>
}

export function NavMenu({ menu }: NavMenuProps) {
  const [maxVisibleItems, setMaxVisibleItems] = useState(3)

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      // Tablet breakpoint: 768px (md), Desktop breakpoint: 1280px (xl)
      if (width >= 1280) {
        setMaxVisibleItems(3) // Desktop: 3 items
      } else if (width >= 1024) {
        setMaxVisibleItems(2) // Small Desktop: 2 items
      } else if (width >= 768) {
        setMaxVisibleItems(1) // Tablet: 1 item
      }
    }

    // Set initial value
    handleResize()

    // Listen for window resize
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!menu.length) return null

  const visibleItems = menu.slice(0, maxVisibleItems)
  const hiddenItems = menu.slice(maxVisibleItems)

  return (
    <ul className="hidden gap-6 text-sm md:flex md:items-center list-none">
      {visibleItems.map((item) => (
        <li key={item.id}>
          <Suspense fallback={<NavLink label={item.link.label} url={`${item.link.url}`} />}>
            <ActiveStateNavLink label={item.link.label} url={`${item.link.url}`} />
          </Suspense>
        </li>
      ))}
      {hiddenItems.length > 0 && (
        <li>
          <PopoverMenu menu={hiddenItems} />
        </li>
      )}
    </ul>
  )
}

const PopoverMenu = ({ menu }: { menu: NavMenuProps['menu'] }) => {
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          'text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-neutral-300',
          'flex items-center gap-1 underline-offset-4 hover:underline',
          'transition-colors duration-200 group',
          'outline-none focus:outline-none focus-visible:outline-none',
        )}
      >
        <span>More</span>
        <ChevronDown className="h-4 w-4 group-data-popup-open:rotate-180 shrink-0 transition-all ease-out" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-48">
        <ul className="flex flex-col gap-2 list-none">
          {menu.map((item) => (
            <li key={item.id}>
              <Suspense fallback={<NavLink label={item.link.label} url={`${item.link.url}`} />}>
                <ActiveStateNavLink label={item.link.label} url={`${item.link.url}`} />
              </Suspense>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
