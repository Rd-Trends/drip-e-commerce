import { FileQuestion, Home, ArrowLeft } from 'lucide-react'
import { LinkButton } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { BackButton } from '@/components/back-button'

export default function NotFound() {
  return (
    <Empty className="h-lvh flex flex-col justify-center items-center text-center">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileQuestion />
        </EmptyMedia>
        <EmptyTitle>404 - Page Not Found</EmptyTitle>
        <EmptyDescription>
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Please check the
          URL or return to the homepage.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <LinkButton href="/">
            <Home className="mr-2 h-4 w-4" />
            Go to Homepage
          </LinkButton>
          <BackButton variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </BackButton>
        </div>
        <EmptyDescription className="mt-4">
          Need help?{' '}
          <LinkButton href="/contact" variant="link">
            Contact support
          </LinkButton>
        </EmptyDescription>
      </EmptyContent>
    </Empty>
  )
}
