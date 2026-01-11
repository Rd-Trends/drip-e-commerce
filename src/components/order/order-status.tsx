import { Badge } from '@/components/ui/badge'
import { Order } from '@/payload-types'
import { cn } from '@/lib/utils'

type Props = {
  status: Order['status']
  className?: string
}

const statusConfig = {
  processing: {
    variant: 'outline' as const,
    label: 'Processing',
  },
  shipped: {
    variant: 'default' as const,
    label: 'Shipped',
  },
  completed: {
    variant: 'secondary' as const,
    label: 'Completed',
  },
  cancelled: {
    variant: 'destructive' as const,
    label: 'Cancelled',
  },
  refunded: {
    variant: 'ghost' as const,
    label: 'Refunded',
  },
} as const

export const OrderStatus: React.FC<Props> = ({ status, className }) => {
  if (!status) return null

  const config = statusConfig[status] || statusConfig.processing

  return (
    <Badge variant={config.variant} className={cn('uppercase', className)}>
      {config.label}
    </Badge>
  )
}
