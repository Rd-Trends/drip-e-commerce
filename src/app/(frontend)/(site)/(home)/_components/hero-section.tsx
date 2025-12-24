'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Autoplay from 'embla-carousel-autoplay'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/layout/section'
import Container from '@/components/layout/container'
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'
import type { Home, Media } from '@/payload-types'

interface HeroSectionProps {
  slides: Home['heroSlides']
}

export function HeroSection({ slides }: HeroSectionProps) {
  const plugin = React.useRef(Autoplay({ delay: 5000, stopOnInteraction: true }))

  const defaultSlides: Home['heroSlides'] = [
    {
      id: 'default',
      title: 'Discover Your Style',
      subtitle: 'New Arrival',
      description:
        'Explore the latest trends in fashion and find your perfect look with our new collection.',
      image: {
        id: 1,
        url: '/media/tshirt-black-4.png',
        alt: 'Hero Image',
        updatedAt: '',
        createdAt: '',
      } as Media,
      contentAlign: 'left',
      theme: 'dark',
      links: [
        {
          id: 'default-link',
          link: {
            url: '/shop',
            label: 'Shop Now',
          },
        },
      ],
    },
  ]

  const activeSlides = slides && slides.length > 0 ? slides : defaultSlides

  return (
    <Section paddingY="sm">
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
        opts={{
          loop: true,
        }}
      >
        <CarouselContent>
          {activeSlides?.map((slide, index) => {
            const image = slide.image as Media
            // We are using the static design, so we might ignore 'theme' and 'contentAlign'
            // to strictly follow "use this same design", OR we can try to adapt it.
            // The user said "use this same design", which implies the layout (grid, badge, h1, p, button, image).
            // I will map the fields to this layout.

            return (
              <CarouselItem key={index}>
                <Container className="relative rounded-2xl bg-primary/5 p-6 md:p-12 lg:p-16">
                  <div className="grid gap-6 md:grid-cols-2 items-center">
                    <div className="space-y-4">
                      {slide.subtitle && <Badge>{slide.subtitle}</Badge>}
                      <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                        {slide.title}
                      </h1>
                      {slide.description && (
                        <p className="max-w-150 text-muted-foreground md:text-xl">
                          {slide.description}
                        </p>
                      )}

                      {slide.links && slide.links.length > 0 && (
                        <div className="flex flex-wrap gap-4">
                          {slide.links.map((linkItem, i) => {
                            const { link } = linkItem
                            if (!link.url) return null
                            return (
                              <Button key={i} size="lg" className="rounded-full" asChild>
                                <Link href={link.url}>{link.label}</Link>
                              </Button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    <div className="relative flex justify-end">
                      {image?.url && (
                        <Image
                          src={image.url}
                          alt={image.alt || slide.title}
                          width={500}
                          height={500}
                          className="w-full lg:w-100 h-auto object-cover rounded-xl"
                          priority={index === 0}
                        />
                      )}
                    </div>
                  </div>
                </Container>
              </CarouselItem>
            )
          })}
        </CarouselContent>

        {/* Dots Navigation */}
        {activeSlides.length > 1 && (
          <CarouselDots className="absolute bottom-4 left-0 right-0 flex justify-center gap-2" />
        )}
      </Carousel>
    </Section>
  )
}
