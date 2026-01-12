import { Badge } from '@/components/ui/badge'
import { Order } from '@/payload-types'
import { cn } from '@/lib/utils'

type Props = {
  status: Order['status']
  className?: string
}

const statusConfig: Record<
  NonNullable<Order['status']>,
  { variant: NonNullable<React.ComponentProps<typeof Badge>['variant']>; label: string }
> = {
  processing: {
    variant: 'outline',
    label: 'Processing',
  },
  shipped: {
    variant: 'default',
    label: 'Shipped',
  },
  completed: {
    variant: 'secondary',
    label: 'Completed',
  },
  cancelled: {
    variant: 'destructive',
    label: 'Cancelled',
  },
  refunded: {
    variant: 'ghost',
    label: 'Refunded',
  },
}

export const OrderStatus: React.FC<Props> = ({ status, className }) => {
  if (!status) return null

  const config = statusConfig[status] || statusConfig.processing

  return (
    <Badge variant={config.variant} className={cn('uppercase', className)}>
      {config.label}
    </Badge>
  )
}
