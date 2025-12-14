import type * as React from 'react'
import { cn } from '@/lib/utils'

export type ContainerSize = 'sm' | 'md' | 'lg' | 'full'

const sizeClassMap: Record<ContainerSize, string> = {
  sm: 'max-w-screen-md',
  md: 'max-w-screen-lg',
  lg: 'max-w-screen-xl',
  full: 'max-w-full',
}

export type ContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: ContainerSize
  center?: boolean
}

/**
 * Container
 *
 * Controls max-width and horizontal padding. Defaults to a centered container
 * with responsive padding.
 *
 * Usage:
 * <Container size="xl" paddingX="md">...</Container>
 */
export function Container({ className, size = 'lg', center = true, ...props }: ContainerProps) {
  return (
    <div className={cn('w-full', center && 'mx-auto', sizeClassMap[size], className)} {...props} />
  )
}

export default Container
