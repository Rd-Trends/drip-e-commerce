import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Fragment } from 'react'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Fragment>
      <Navbar />
      {children}
      <Footer />
    </Fragment>
  )
}
