'use client'

import type { Product } from '@/payload-types'

import { Media } from '@/components/media'
import { GridTileImage } from '@/components/grid/tile'
import { useQueryStates, parseAsInteger } from 'nuqs'
import React, { useEffect, useMemo } from 'react'

import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { Skeleton } from '../ui/skeleton'

type Props = {
  gallery: NonNullable<Product['gallery']>
  variantTypes?: Product['variantTypes']
}

const Gallery: React.FC<Props> = ({ gallery, variantTypes }) => {
  // Create dynamic parser config for all variant types
  const parserConfig = useMemo(() => {
    const config: Record<string, ReturnType<typeof parseAsInteger.withDefault>> = {
      variant: parseAsInteger.withDefault(0),
      image: parseAsInteger.withDefault(0),
    }

    if (variantTypes && Array.isArray(variantTypes)) {
      variantTypes.forEach((type) => {
        if (type && typeof type === 'object') {
          config[type.name] = parseAsInteger.withDefault(0)
        }
      })
    }

    return config
  }, [variantTypes])

  const [params] = useQueryStates(parserConfig, { shallow: true })
  const [current, setCurrent] = React.useState(0)
  const [api, setApi] = React.useState<CarouselApi>()

  useEffect(() => {
    if (!api) {
      return
    }
  }, [api])

  useEffect(() => {
    if (!api) return

    // Get array of selected options as {key: variantTypeName, value: optionId}
    const selectedOptions = Object.entries(params)

    // Find gallery item that matches any selected option
    if (selectedOptions.length > 0) {
      const index = gallery.findIndex((item) => {
        if (!item.variantOption) return false

        return selectedOptions.some(([key, value]) => {
          if (
            item.variantOption &&
            typeof item.variantOption === 'object' &&
            typeof item.variantOption.variantType === 'object'
          ) {
            return item.variantOption.variantType.name === key && item.variantOption.id === value
          }
          return false
        })
      })

      if (index !== -1) {
        setCurrent(index)
        api.scrollTo(index, true)
      }
    }
  }, [params, api, gallery])

  return (
    <div>
      <div className="relative w-full overflow-hidden mb-8">
        <Media
          resource={gallery[current].image}
          className="w-full"
          imgClassName="w-full rounded-lg bg-secondary"
        />
      </div>

      <Carousel setApi={setApi} className="w-full" opts={{ align: 'start', loop: false }}>
        <CarouselContent>
          {gallery.map((item, i) => {
            if (typeof item.image !== 'object') return null

            return (
              <CarouselItem
                className="basis-1/5"
                key={`${item.image.id}-${i}`}
                onClick={() => setCurrent(i)}
              >
                <GridTileImage active={i === current} media={item.image} />
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
    </div>
  )
}

const GallerySkeleton = () => {
  return (
    <div>
      <div className="relative w-full overflow-hidden mb-8">
        <Skeleton className="w-full aspect-square rounded-lg" />
      </div>

      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="flex-1 aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export { Gallery, GallerySkeleton }
