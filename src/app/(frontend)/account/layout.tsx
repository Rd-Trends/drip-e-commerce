import { Fragment, type ReactNode } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { BottomNavigation } from '@/components/layout/bottom-navigation'
import { AccountNav } from '@/components/account/account-nav'
import { Separator } from '@/components/ui/separator'
import Section from '@/components/layout/section'
import Container from '@/components/layout/container'
import { TopBanner } from '@/components/layout/top-banner'

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <Fragment>
      <TopBanner />
      <Navbar />
      <Section paddingY="xs">
        <Container className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Account</h2>
          <p className="text-muted-foreground">
            Manage your account settings and view your orders.
          </p>
        </Container>
        <Separator className="my-6" />
        <div className="flex flex-col lg:flex-row gap-6 xl:gap-10">
          <Container
            as="aside"
            className="bg-background/95 backdrop-blur-md lg:bg-transparent lg:backdrop-blur-none py-3 md:py-0 border-b md:border-b-0 z-50 h-fit lg:w-1/5 sticky top-16 lg:top-24"
          >
            <AccountNav />
          </Container>
          <Container className="flex-1 lg:max-w-4xl">{children}</Container>
        </div>
      </Section>
      <Footer />
      <BottomNavigation />
    </Fragment>
  )
}
