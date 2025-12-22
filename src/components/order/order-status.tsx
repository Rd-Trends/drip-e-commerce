import { cn } from '@/lib/utils'
import { OrderStatus as StatusOptions } from '@/payload-types'

type Props = {
  status: StatusOptions
  className?: string
}

export const OrderStatus: React.FC<Props> = ({ status, className }) => {
  return (
    <div
      className={cn(
        'text-xs tracking-widest font-mono uppercase py-0 px-2 rounded w-fit',
        className,
        {
          'bg-primary/10': status === 'processing',
          'bg-success': status === 'completed',
        },
      )}
    >
      {status}
    </div>
  )
}
