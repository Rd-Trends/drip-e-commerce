import React from 'react'

import type { CallToActionBlock as CTABlockProps } from '@/payload-types'
import { RichText } from '@/components/rich-text'
import Container from '@/components/layout/container'
import Section from '@/components/layout/section'
import { LinkButton } from '@/components/ui/button'

export const CallToActionBlock: React.FC<
  CTABlockProps & {
    id?: string | number
    className?: string
  }
> = ({ links, richText, className }) => {
  return (
    <Section paddingY="none" className={className}>
      <Container className="relative overflow-hidden rounded-lg bg-background border px-8 py-12 md:px-16 md:py-20">
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 h-64 w-64 translate-x-32 -translate-y-1/2 rounded-full bg-primary-foreground/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-32 rounded-full bg-primary-foreground/5 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          {/* Content */}
          <div className="max-w-2xl">
            {richText && <RichText className="mb-0" data={richText} enableGutter={false} />}
          </div>

          {/* CTA Links */}
          <div className="flex shrink-0 flex-col gap-4 sm:flex-row md:flex-col">
            {(links || []).map(({ link }, i) => {
              return (
                <LinkButton
                  key={i}
                  href={link.url}
                  variant={link.appearance}
                  target={link.newTab ? '_blank' : '_self'}
                >
                  {link?.label}
                </LinkButton>
              )
            })}
          </div>
        </div>
      </Container>
    </Section>
  )
}
