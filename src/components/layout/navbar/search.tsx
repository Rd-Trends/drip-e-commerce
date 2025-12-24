'use client'

import { Input } from '@/components/ui/input'
import { SearchIcon } from 'lucide-react'
import Form from 'next/form'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { parseAsString, useQueryState } from 'nuqs'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Fragment, useState } from 'react'
import { Button } from '@/components/ui/button'

export function Search() {
  const [searchQuery] = useQueryState('q', parseAsString.withDefault(''))

  return (
    <Fragment>
      <Form
        action="/shop"
        className="hidden md:block w-max-[550px] relative w-full lg:w-80 xl:w-full"
      >
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

      <MobileSearchDialog />
    </Fragment>
  )
}

export function SearchSkeleton() {
  return (
    <Fragment>
      <form className="hidden md:block w-max-[550px] relative w-full lg:w-80 xl:w-full">
        <InputGroup>
          <InputGroupInput placeholder="Search for products..." />
          <InputGroupAddon align="inline-end">
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
      </form>
      <Button variant="ghost" size="icon" className="md:hidden">
        <SearchIcon className="size-5" />
      </Button>
    </Fragment>
  )
}

function MobileSearchDialog() {
  const [open, onOpenChange] = useState(false)

  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <SearchIcon className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Search Products</DialogTitle>
        </DialogHeader>
        <Form action={'/shop'} className="relative w-full">
          <InputGroup>
            <InputGroupInput
              type="text"
              name="q"
              placeholder="Search for products..."
              autoComplete="off"
              autoFocus
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                aria-label="Search"
                title="Search"
                onClick={() => {
                  onOpenChange(false)
                }}
              >
                <SearchIcon className="h-4 w-4" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
