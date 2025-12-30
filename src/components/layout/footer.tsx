import Link from 'next/link'
import { getCachedGlobal } from '@/lib/get-global.'
import { Logo } from '@/components/logo'
import Section from './section'
import Container from './container'

// Footer link group component for better organization
function FooterLinkGroup({
  title,
  links,
}: {
  title: string
  links: Array<{ href: string; label: string }>
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Customer Support links as requested
const supportLinks = [
  { href: '/size-guide', label: 'Size Guide' },
  { href: '/shipping-info', label: 'Shipping Info' },
  { href: '/returns-exchange', label: 'Returns & Exchange' },
  { href: '/faqs', label: 'FAQs' },
  { href: '/contact-us', label: 'Contact Us' },
]

// Quick access links
const quickLinks = [
  { href: '/shop', label: 'Shop Now' },
  { href: '/account', label: 'My Account' },
  { href: '/orders', label: 'Track Order' },
]

// Legal links
const legalLinks = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
]

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
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Section */}
          <div>
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground">
              Your premier destination for classic and flashy fashion styles. Discover trendy
              clothing for youths, teens, and young parents.
            </p>
          </div>

          <div className="lg:col-span-3 grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4">
            {/* Customer Support */}
            <FooterLinkGroup title="Customer Support" links={supportLinks} />

            {/* Quick Links */}
            <FooterLinkGroup title="Quick Links" links={quickLinks} />

            {/* Navigation from CMS */}
            {navItems.length > 0 && (
              <FooterLinkGroup
                title="Explore"
                links={navItems.map((item) => ({
                  href: item.link.url || '#',
                  label: item.link.label,
                }))}
              />
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 pb-16 md:pb-0 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Drip E-Commerce. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  )
}
