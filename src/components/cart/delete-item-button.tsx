'use client'

import type { CartItem } from '@/components/cart'
import { useRemoveFromCart } from '@/hooks/use-cart-queries'
import { cn } from '@/lib/utils'
import { XIcon } from 'lucide-react'
import React from 'react'

export function DeleteItemButton({ item }: { item: CartItem }) {
  const { mutate, isPending } = useRemoveFromCart()
  const itemId = item.id

  return (
    <button
      aria-label="Remove cart item"
      className={cn(
        'ease hover:cursor-pointer flex h-[17px] w-[17px] items-center justify-center rounded-full bg-neutral-500 transition-all duration-200',
        {
          'cursor-not-allowed px-0': !itemId || isPending,
        },
      )}
      disabled={!itemId || isPending}
      onClick={(e: React.FormEvent<HTMLButtonElement>) => {
        e.preventDefault()
        if (itemId) mutate(itemId)
      }}
      type="button"
    >
      <XIcon className="hover:text-accent-3 mx-px h-4 w-4 text-white dark:text-black" />
    </button>
  )
}
