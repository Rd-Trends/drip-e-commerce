'use client'

import { CartItem } from '@/components/cart'
import { useUpdateCartItemQuantity } from '@/hooks/use-cart-queries'
import { cn } from '@/lib/utils'
import { MinusIcon, PlusIcon } from 'lucide-react'
import React, { useCallback, useMemo } from 'react'

export function CartItemAdjuster({ item }: { item: CartItem }) {
  const { mutate, isPending } = useUpdateCartItemQuantity()

  const incrementItem = useCallback(
    (itemID: string) => {
      mutate({ itemID, action: 'increment' })
    },
    [mutate],
  )

  const decrementItem = useCallback(
    (itemID: string) => {
      mutate({ itemID, action: 'decrement' })
    },
    [mutate],
  )

  return (
    <div className="ml-auto flex h-9 flex-row items-center rounded-lg border">
      <EditItemQuantityButton
        item={item}
        type="minus"
        isUpdating={isPending}
        handleEdit={decrementItem}
      />
      <p className="w-6 text-center">
        <span className="w-full text-sm">{item.quantity}</span>
      </p>
      <EditItemQuantityButton
        item={item}
        type="plus"
        isUpdating={isPending}
        handleEdit={incrementItem}
      />
    </div>
  )
}

function EditItemQuantityButton({
  type,
  item,
  handleEdit,
  isUpdating,
}: {
  item: CartItem
  type: 'minus' | 'plus'
  handleEdit: (itemId: string) => void
  isUpdating: boolean
}) {
  const disabled = useMemo(() => {
    if (!item.id) return true

    const target =
      item.variant && typeof item.variant === 'object'
        ? item.variant
        : item.product && typeof item.product === 'object'
          ? item.product
          : null

    if (
      target &&
      typeof target === 'object' &&
      target.inventory !== undefined &&
      target.inventory !== null
    ) {
      if (type === 'plus' && item.quantity !== undefined && item.quantity !== null) {
        return item.quantity >= target.inventory
      }
    }

    return false
  }, [item, type])

  return (
    <button
      disabled={disabled || isUpdating}
      aria-label={type === 'plus' ? 'Increase item quantity' : 'Reduce item quantity'}
      className={cn(
        'ease hover:cursor-pointer flex h-full min-w-9 max-w-9 flex-none items-center justify-center rounded-full px-2 transition-all duration-200 hover:border-neutral-800 hover:opacity-80',
        {
          'cursor-not-allowed': disabled || isUpdating,
          'ml-auto': type === 'minus',
        },
      )}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()

        if (item.id) {
          handleEdit(item.id)
        }
      }}
      type="button"
    >
      {type === 'plus' ? (
        <PlusIcon className="h-4 w-4 dark:text-neutral-500 hover:text-blue-300" />
      ) : (
        <MinusIcon className="h-4 w-4 dark:text-neutral-500 hover:text-blue-300" />
      )}
    </button>
  )
}
