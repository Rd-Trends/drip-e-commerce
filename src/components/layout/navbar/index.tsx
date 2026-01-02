import { Suspense } from 'react'
import { MobileMenu, MobileMenuFallback } from '../sidebar'
import { Search, SearchSkeleton } from './search'
import { CustomerProfile } from './customer-profile'
import { getCachedGlobal } from '@/lib/get-global.'
import { CartModal } from '@/components/cart/cart-modal'
import { ActiveStateNavLink, NavLink } from './nav-link'
import { Logo } from '@/components/logo'
import Section from '../section'
import Container from '../container'
import { ThemeToggleDropdown } from '../theme-toggle-dropdown'

export async function Navbar() {
  const header = await getCachedGlobal('header', 1)()
  const menu = header?.navItems || []

  return (
    <Section
      paddingY="none"
      className="top-0 sticky z-50 bg-background/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800"
    >
      <Container as="nav" className="h-16 flex items-center justify-between">
        <div className="flex items-center gap-6 w-1/3">
          <Logo />
          {menu.length ? (
            <ul className="hidden gap-6 text-sm md:flex md:items-center">
              {menu.map((item) => (
                <Suspense
                  key={item.id}
                  fallback={<NavLink label={item.link.label} url={`${item.link.url}`} />}
                >
                  <ActiveStateNavLink label={item.link.label} url={`${item.link.url}`} />
                </Suspense>
              ))}
            </ul>
          ) : null}
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
