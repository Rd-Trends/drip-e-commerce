import Link from 'next/link'
import { Media } from '@/components/media'
import { Category } from '@/payload-types'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

type CategoryCardProps = {
  category: Category & { productCount?: number }
  className?: string
}

export function CategoryCard({ category, className }: CategoryCardProps) {
  const media = category.image

  return (
    <Link
      href={`/shop?category=${category.slug}`}
      className={cn(
        'group relative flex h-full w-full flex-col justify-end overflow-hidden rounded-xl bg-muted transition-colors hover:opacity-90 aspect-4/5',
        className,
      )}
    >
      {media && (
        <div className="absolute inset-0 z-0">
          <Media
            resource={media}
            fill
            imgClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 z-10 bg-linear-to-t from-black/60 via-black/20 to-transparent" />

      <div className="relative z-20 p-4 text-white">
        <h3 className="font-bold leading-none text-lg">{category.title}</h3>
        {category.productCount !== undefined && (
          <p className="mt-1 text-sm text-white/80">{category.productCount} items</p>
        )}
      </div>
    </Link>
  )
}

export function CategoryCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col justify-end overflow-hidden rounded-xl aspect-4/5',
        className,
      )}
    >
      <Skeleton className="absolute inset-0 h-full w-full" />
      <div className="relative z-20 p-4 w-full">
        <Skeleton className="h-6 w-2/3 mb-2 bg-white/20" />
        <Skeleton className="h-4 w-1/3 bg-white/20" />
      </div>
    </div>
  )
}
