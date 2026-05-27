'use client'

import { useEffect } from 'react'
import { AlertTriangle, Home, RotateCcw } from 'lucide-react'
import { Button, LinkButton } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Empty className="h-lvh flex flex-col justify-center items-center text-center">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <AlertTriangle />
        </EmptyMedia>
        <EmptyTitle>Something went wrong</EmptyTitle>
        <EmptyDescription>
          An unexpected error occurred. Please try again, or return to the homepage if the problem
          persists.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <LinkButton href="/" variant="outline" scrollToTop>
            <Home className="mr-2 h-4 w-4" />
            Go to Homepage
          </LinkButton>
        </div>
        {error.digest && (
          <EmptyDescription className="mt-2 font-mono text-xs">
            Error ID: {error.digest}
          </EmptyDescription>
        )}
      </EmptyContent>
    </Empty>
  )
}
