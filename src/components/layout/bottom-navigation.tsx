'use client'

import Link from 'next/link'
import { Home, Store, ShoppingBag, User } from 'lucide-react'
import { useCart } from '@/providers/cart'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function BottomNavigation() {
  const { setIsOpen } = useCart()
  const [showBottomNav, setShowBottomNav] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    if (pathname.startsWith('/products/')) {
      setShowBottomNav(false)
    } else {
      setShowBottomNav(true)
    }
  }, [pathname])

  if (!showBottomNav) return null

  const isHome = pathname === '/'
  const isShop = pathname.startsWith('/shop')
  const isAccount = pathname.startsWith('/account')

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
        <div className="grid grid-cols-4 h-16">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isHome ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link
            href="/shop"
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isShop ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <Store className="h-5 w-5" />
            <span className="text-[10px] font-medium">Shop</span>
          </Link>
          <button
            onClick={() => setIsOpen(true)}
            className="outline-none border-0 bg-transparent flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="text-[10px] font-medium">Cart</span>
          </button>
          <Link
            href="/account"
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isAccount ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-medium">Account</span>
          </Link>
        </div>
      </nav>
    </>
  )
}
