import type { Product } from '@/payload-types'

import { Media } from '@/components/media'
import { Price } from '@/components/price'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import React from 'react'
import { cn } from '@/lib/utils'

type Props = {
  product: Partial<Product>
}

export const ProductGridItem: React.FC<Props> = ({ product }) => {
  const { gallery, priceInNGN, title } = product

  let price = priceInNGN

  const variants = product.variants?.docs

  if (variants && variants.length > 0) {
    const variant = variants[0]
    if (
      variant &&
      typeof variant === 'object' &&
      variant?.priceInNGN &&
      typeof variant.priceInNGN === 'number'
    ) {
      price = variant.priceInNGN
    }
  }

  const image =
    gallery?.[0]?.image && typeof gallery[0]?.image !== 'string' ? gallery[0]?.image : false

  return (
    <Link className="relative inline-block h-full w-full group" href={`/products/${product.slug}`}>
      {image ? (
        <Media
          className={cn(
            'relative aspect-square object-cover border rounded-xl md:rounded-2xl p-2 md:p-8 bg-secondary/90 group-hover:border-primary',
          )}
          height={80}
          imgClassName={cn('h-full w-full object-cover rounded-2xl', {
            'transition duration-300 ease-in-out group-hover:scale-102': true,
          })}
          resource={image}
          width={80}
        />
      ) : null}

      <div className="group-hover:text-primary flex flex-col md:flex-row justify-between items-start md:items-center mt-4">
        <h3 className="text-md font-medium">{title}</h3>

        {typeof price === 'number' && <Price amount={price} className="font-mono" />}
      </div>
    </Link>
  )
}

export const ProductGridItemSkeleton = () => {
  return (
    <div className="relative inline-block h-full w-full">
      <Skeleton
        className={cn(
          'relative aspect-square border rounded-xl md:rounded-2xl p-2 md:p-8 bg-secondary/90',
        )}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-4 gap-2">
        <Skeleton className="h-5 w-3/4 md:w-1/2" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  )
}
