'use client'

import Link from 'next/link'
import { Home, Heart, ShoppingBag, User } from 'lucide-react'
import { useCart } from '@/providers/cart'

export function MobileNav() {
  const { setIsOpen } = useCart()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="grid grid-cols-4 h-16">
        <Link href="/" className="flex flex-col items-center justify-center gap-1 text-primary">
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium">Shop</span>
        </Link>
        <Link
          href="/wishlist"
          className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary"
        >
          <Heart className="h-5 w-5" />
          <span className="text-[10px] font-medium">Wishlist</span>
        </Link>
        <button
          onClick={() => setIsOpen(true)}
          className="outline-none border-0 bg-transparent flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary"
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="text-[10px] font-medium">Cart</span>
        </button>
        <Link
          href="/account"
          className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary"
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] font-medium">Account</span>
        </Link>
      </div>
    </nav>
  )
}
