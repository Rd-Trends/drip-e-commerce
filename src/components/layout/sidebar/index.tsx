'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

import { Search, SearchSkeleton } from '../navbar/search'
import { MobileUserMenu } from './user-dropdown'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MenuIcon, X } from 'lucide-react'
import { Header } from '@/payload-types'

export default function MobileMenu({ menu }: { menu: NonNullable<Header['navItems']> }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const closeMobileMenu = () => setIsOpen(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname, searchParams])

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className={cn('md:hidden')}>
          <MenuIcon className="size-5" />
          <span className="sr-only">
            Open mobile <menu></menu>
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
        style={
          {
            '--sidebar-width': '100%',
          } as React.CSSProperties
        }
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Site Navigation</SheetTitle>
          <SheetDescription>Displays the site navigation for mobile devices</SheetDescription>
        </SheetHeader>
        <div className="p-4 flex-1 flex flex-col">
          <Button
            onClick={closeMobileMenu}
            variant={'outline'}
            size={'icon'}
            aria-label="Close mobile menu"
          >
            <X className="h-4" />
          </Button>

          <div className="py-4 w-full">
            <Suspense fallback={<SearchSkeleton />}>
              <Search />
            </Suspense>
          </div>
          {menu.length ? (
            <ul className="flex w-full flex-col flex-1">
              {menu.map((item) => (
                <li
                  className="py-2 text-base text-black transition-colors hover:text-neutral-500 dark:text-white"
                  key={item.id}
                >
                  <Link href={`${item.link.url}`} prefetch={true} onClick={closeMobileMenu}>
                    {item.link.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          <MobileUserMenu onMenuClose={closeMobileMenu} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
