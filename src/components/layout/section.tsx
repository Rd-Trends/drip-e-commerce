import type * as React from 'react'
import { cn } from '@/lib/utils'

type SectionY = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type SectionX = 'none' | 'sm' | 'md' | 'lg'

const paddingYMap: Record<SectionY, string> = {
  none: 'py-0',
  xs: 'py-6 md:py-8',
  sm: 'py-8 md:py-12',
  md: 'py-12 md:py-16',
  lg: 'py-16 md:py-20',
  xl: 'py-20 md:py-24 lg:py-32',
}

const paddingXClassMap: Record<SectionX, string> = {
  none: 'px-0',
  sm: 'px-3 md:px-4',
  md: 'px-4 md:px-6',
  lg: 'px-4 md:px-10',
}

export type SectionProps = React.HTMLAttributes<HTMLElement> & {
  as?: keyof HTMLElementTagNameMap
  paddingY?: SectionY
  paddingX?: SectionX
}

/**
 * Section
 *
 * Controls vertical spacing for a page section. Combine with <Container />
 * to manage max-width and horizontal padding.
 *
 * Usage:
 * <Section paddingY="lg"><Container>...</Container></Section>
 */
export function Section({
  as = 'section',
  className,
  paddingY = 'lg',
  paddingX = 'lg',
  ...props
}: SectionProps) {
  const Comp = as
  return (
    <Comp
      className={cn(
        'scroll-mt-(--header-height)',
        paddingYMap[paddingY],
        paddingXClassMap[paddingX],
        className,
      )}
      {...props}
    />
  )
}

export default Section
