import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { BottomNavigation } from '@/components/layout/bottom-navigation'
import { TopBanner } from '@/components/layout/top-banner'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-svh">
      <TopBanner />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <BottomNavigation />
    </div>
  )
}
