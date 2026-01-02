'use client'

import { SearchIcon } from 'lucide-react'
import Form from 'next/form'
import { parseAsString, useQueryState } from 'nuqs'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

export function Search() {
  const [searchQuery] = useQueryState('q', parseAsString.withDefault(''))

  return (
    <Form action="/shop" className=" w-max-[550px] relative w-full lg:w-80 xl:w-full">
      <InputGroup>
        <InputGroupInput
          key={searchQuery}
          type="text"
          name="q"
          placeholder="Search for products..."
          autoComplete="off"
          defaultValue={searchQuery}
        />
        <InputGroupAddon align="inline-end">
          <SearchIcon />
        </InputGroupAddon>
      </InputGroup>
    </Form>
  )
}

export function SearchSkeleton() {
  return (
    <form className="w-max-[550px] relative w-full lg:w-80 xl:w-full">
      <InputGroup>
        <InputGroupInput placeholder="Search for products..." />
        <InputGroupAddon align="inline-end">
          <SearchIcon />
        </InputGroupAddon>
      </InputGroup>
    </form>
  )
}
