'use client'

import { useRouter } from 'next/navigation'
import { Button } from './ui/button'

export function BackButton({ ...props }: React.ComponentProps<typeof Button>) {
  const router = useRouter()

  return <Button {...props} onClick={() => router.back()} />
}
