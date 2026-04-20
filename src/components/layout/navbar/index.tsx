import { Suspense } from 'react'
import { MobileMenu, MobileMenuFallback } from '../sidebar'
import { Search, SearchSkeleton } from './search'
import { CustomerProfile } from './customer-profile'
import { getCachedGlobal } from '@/lib/get-global.'
import { CartModal } from '@/components/cart/cart-modal'
import { Logo } from '@/components/logo'
import Section from '../section'
import Container from '../container'
import { ThemeToggleDropdown } from '../theme-toggle-dropdown'
import { NavMenu } from './nav-menu'

export async function Navbar() {
  const header = await getCachedGlobal('header', 1)()
  const menu = header?.navItems || []

  return (
    <Section
      paddingY="none"
      className="sticky top-(--banner-height) z-50 bg-background/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800"
    >
      <Container as="nav" className="h-(--navbar-height) flex items-center justify-between">
        <div className="flex items-center gap-6 w-1/3">
          <Logo />
          <NavMenu menu={menu} />
        </div>

        <div className="hidden md:flex justify-center w-1/3">
          <Suspense fallback={<SearchSkeleton />}>
            <Search />
          </Suspense>
        </div>
        <div className="flex justify-end items-center gap-3 md:w-1/3">
          <CustomerProfile />
          <CartModal />
          <ThemeToggleDropdown />
          <Suspense fallback={<MobileMenuFallback />}>
            <MobileMenu menu={menu} />
          </Suspense>
        </div>
      </Container>
    </Section>
  )
}
