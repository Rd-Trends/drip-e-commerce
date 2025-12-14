import { Navbar } from '@/components/layout/navbar'
import { Fragment } from 'react'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Fragment>
      <Navbar />
      {children}
    </Fragment>
  )
}
