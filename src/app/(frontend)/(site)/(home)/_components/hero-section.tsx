'use client'

import * as React from 'react'
import Image from 'next/image'
import Autoplay from 'embla-carousel-autoplay'

import { Badge } from '@/components/ui/badge'
import { LinkButton } from '@/components/ui/button'
import { Section } from '@/components/layout/section'
import Container from '@/components/layout/container'
import { Carousel, CarouselContent, CarouselDots, CarouselItem } from '@/components/ui/carousel'
import type { Home, Media } from '@/payload-types'

export function HeroSection({ slides = [] }: { slides: NonNullable<Home['heroSlides']> }) {
  return (
    <Section paddingY="sm">
      <Carousel
        plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
        className="w-full"
        opts={{
          loop: true,
        }}
      >
        <CarouselContent>
          {slides.map((slide, index) => {
            const image = slide.image as Media

            return (
              <CarouselItem key={index}>
                <Container className="relative rounded-2xl bg-primary/5 p-6 md:p-12 lg:p-16">
                  <div className="grid gap-6 md:grid-cols-2 items-center">
                    <div className="space-y-4">
                      {slide.badge && <Badge>{slide.badge}</Badge>}
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
                              <LinkButton
                                key={i}
                                size="lg"
                                className="rounded-full"
                                href={link.url}
                              >
                                {link.label}
                              </LinkButton>
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
        {slides.length > 1 && (
          <CarouselDots className="absolute bottom-4 left-0 right-0 flex justify-center gap-2" />
        )}
      </Carousel>
    </Section>
  )
}
