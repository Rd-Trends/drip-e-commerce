'use client'

import type { Product } from '@/payload-types'

import { Media } from '@/components/media'
import { GridTileImage } from '@/components/grid/tile'
import { useQueryStates, parseAsInteger } from 'nuqs'
import React, { useEffect, useMemo } from 'react'

import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { DefaultDocumentIDType } from 'payload'

type Props = {
  gallery: NonNullable<Product['gallery']>
}

export const Gallery: React.FC<Props> = ({ gallery }) => {
  const [params] = useQueryStates(
    {
      variant: parseAsInteger.withDefault(0),
      image: parseAsInteger.withDefault(0),
    },
    { shallow: true },
  )
  const [current, setCurrent] = React.useState(0)
  const [api, setApi] = React.useState<CarouselApi>()

  // Get all variant option IDs from params
  const variantOptionIds = useMemo(() => {
    return Object.values(params).filter((value) => value !== 0)
  }, [params])

  useEffect(() => {
    if (!api) {
      return
    }
  }, [api])

  useEffect(() => {
    if (variantOptionIds.length > 0 && api) {
      const index = gallery.findIndex((item) => {
        if (!item.variantOption) return false

        let variantID: DefaultDocumentIDType

        if (typeof item.variantOption === 'object') {
          variantID = item.variantOption.id
        } else variantID = item.variantOption

        return variantOptionIds.includes(Number(variantID))
      })
      if (index !== -1) {
        setCurrent(index)
        api.scrollTo(index, true)
      }
    }
  }, [variantOptionIds, api, gallery])

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
