import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ShoppingCart } from 'lucide-react'
import React from 'react'

export function OpenCartButton({
  className,
  quantity,
  ...rest
}: React.ComponentProps<typeof Button> & { quantity?: number }) {
  return (
    <Button variant="ghost" size="icon" className={cn('relative', className)} {...rest}>
      <ShoppingCart className="size-5" />
      {quantity && quantity > 0 && (
        <div className="absolute -top-2 -right-2 size-5 rounded-full bg-primary flex items-center justify-center">
          <span className="text-xs font-bold text-primary-foreground">{quantity}</span>
        </div>
      )}
    </Button>
  )
}
