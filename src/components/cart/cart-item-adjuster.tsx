'use client'

import { CartItem } from '@/components/cart'
import { useUpdateCartItemQuantity } from '@/hooks/use-cart-queries'
import { cn } from '@/lib/utils'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useCallback, useMemo } from 'react'

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
    <div className="flex h-8 p-1 w-22 flex-row items-center bg-secondary rounded-full">
      <EditItemQuantityButton
        item={item}
        type="minus"
        isUpdating={isPending}
        handleEdit={decrementItem}
      />
      <div className="flex-1 text-center">
        <span className="text-sm font-medium">{item.quantity}</span>
      </div>
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
        'flex h-full aspect-square items-center justify-center rounded-full transition-colors bg-background hover:bg-background/70 disabled:cursor-not-allowed disabled:opacity-50',
      )}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()

        if (item.id) {
          handleEdit(item.id)
        }
      }}
      type="button"
    >
      {type === 'plus' ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
    </button>
  )
}
