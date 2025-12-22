import type { Product } from '@/payload-types'

import { Media } from '@/components/media'
import { Price } from '@/components/price'
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
            'relative aspect-square object-cover border rounded-xl md:rounded-2xl p-2 md:p-8 bg-primary-foreground group-hover:border-primary',
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
