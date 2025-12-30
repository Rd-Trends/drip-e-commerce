import { cn } from '@/lib/utils'
import React from 'react'
import { RichText } from '@/components/rich-text'
import type { DefaultDocumentIDType } from 'payload'
import type { ContentBlock as ContentBlockProps } from '@/payload-types'
import Section from '@/components/layout/section'
import Container from '@/components/layout/container'
import { LinkButton } from '@/components/ui/button'

export const ContentBlock: React.FC<
  ContentBlockProps & {
    id?: DefaultDocumentIDType
    className?: string
  }
> = (props) => {
  const { columns } = props

  return (
    <Section paddingY="none">
      <Container className="grid grid-cols-4 lg:grid-cols-12 gap-y-8 gap-x-16">
        {columns &&
          columns.length > 0 &&
          columns.map((col, index) => {
            const { enableLink, link, richText, size } = col

            return (
              <div
                className={cn(
                  'col-span-4',
                  size === 'full' && 'lg:col-span-12',
                  size === 'half' && 'lg:col-span-6 md:col-span-2',
                  size === 'oneThird' && 'lg:col-span-4 md:col-span-2',
                  size === 'twoThirds' && 'lg:col-span-8 md:col-span-2',
                )}
                key={index}
              >
                {richText && <RichText data={richText} enableGutter={false} />}

                {enableLink && link && (
                  <LinkButton
                    href={link.url}
                    variant={link.appearance}
                    target={link.newTab ? '_blank' : '_self'}
                  >
                    {link?.label}
                  </LinkButton>
                )}
              </div>
            )
          })}
      </Container>
    </Section>
  )
}
