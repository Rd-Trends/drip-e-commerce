'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Newsletter() {
  return (
    <section className="py-16 border-t">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight">Stay in the Loop</h2>
          <p className="text-muted-foreground">
            Subscribe to our newsletter to get the latest updates on new arrivals, special offers,
            and exclusive deals.
          </p>
          <form
            className="flex w-full max-w-sm items-center space-x-2 pt-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <Input type="email" placeholder="Enter your email" />
            <Button type="submit">Subscribe</Button>
          </form>
          <p className="text-xs text-muted-foreground pt-2">
            By subscribing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </section>
  )
}
