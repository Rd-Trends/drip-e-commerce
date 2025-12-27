import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { BottomNavigation } from '@/components/layout/bottom-navigation'
import { TopBanner } from '@/components/layout/top-banner'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen justify-between">
      <TopBanner />
      <Navbar />
      {children}
      <Footer />
      <BottomNavigation />
    </div>
  )
}
