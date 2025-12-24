'use client'

import type { CartItem } from '@/components/cart'
import { useRemoveFromCart } from '@/hooks/use-cart-queries'
import { cn } from '@/lib/utils'
import { TrashIcon } from 'lucide-react'
import React from 'react'
import { Button } from '../ui/button'

export function DeleteItemButton({ item }: { item: CartItem }) {
  const { mutate, isPending } = useRemoveFromCart()
  const itemId = item.id

  return (
    <Button
      variant="secondary"
      aria-label="Remove cart item"
      className={cn(
        'ease hover:cursor-pointer flex size-8 items-center justify-center rounded-full transition-all duration-200',
        {
          'cursor-not-allowed opacity-50': !itemId || isPending,
        },
      )}
      disabled={!itemId || isPending}
      onClick={(e: React.FormEvent<HTMLButtonElement>) => {
        e.preventDefault()
        if (itemId) mutate(itemId)
      }}
      type="button"
    >
      <TrashIcon className="size-3.5" />
    </Button>
  )
}
