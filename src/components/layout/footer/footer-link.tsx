'use client'

import Link from 'next/link'
import { useCallback } from 'react'

type FooterLinkProps = {
  href: string
  className?: string
  children: React.ReactNode
}

export function FooterLink({ href, className, children }: FooterLinkProps) {
  const handleClick = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [])

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  )
}
