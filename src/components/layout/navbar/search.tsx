'use client'

import { Input } from '@/components/ui/input'
import { SearchIcon } from 'lucide-react'
import Form from 'next/form'
import { parseAsString, useQueryState } from 'nuqs'

export function Search() {
  const [searchQuery] = useQueryState('q', parseAsString.withDefault(''))

  return (
    <Form action="/shop" className="w-max-[550px] relative w-full lg:w-80 xl:w-full">
      <Input
        key={searchQuery}
        type="text"
        name="q"
        placeholder="Search for products..."
        autoComplete="off"
        defaultValue={searchQuery}
      />
      <div className="absolute right-0 top-0 mr-3 flex h-full items-center">
        <SearchIcon className="h-4" />
      </div>
    </Form>
  )
}

export function SearchSkeleton() {
  return (
    <form className="w-max-[550px] relative w-full lg:w-80 xl:w-full">
      <Input placeholder="Search for products..." />
      <div className="absolute right-0 top-0 mr-3 flex h-full items-center">
        <SearchIcon className="h-4" />
      </div>
    </form>
  )
}
