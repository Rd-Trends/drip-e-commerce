import Link from 'next/link'
import { getCachedGlobal } from '@/lib/get-global.'
import { Logo } from '@/components/logo'
import Section from './section'
import Container from './container'

export async function Footer() {
  const footer = await getCachedGlobal('footer', 1)()
  const navItems = footer?.navItems || []

  return (
    <Section
      as="footer"
      paddingY="sm"
      className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
    >
      <Container>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Brand Section */}
          <div className="md:col-span-4">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground">
              Your premier destination for classic and flashy fashion styles. Discover trendy
              clothing for youths, teens, and young parents.
            </p>
          </div>

          {/* Navigation Links */}
          {navItems.length > 0 && (
            <div className="md:col-span-4">
              <h3 className="text-sm font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-3">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.link.url || '#'}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact & Info */}
          <div className="md:col-span-4">
            <h3 className="text-sm font-semibold mb-4">Connect With Us</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="/shop" className="hover:text-foreground transition-colors">
                  Shop Now
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-foreground transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-foreground transition-colors">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 pb-16 md:pb-0 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Drip E-Commerce. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  )
}
