'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createUrl, ListItem } from './helper'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function FilterDropdown({
  list,
  placeholder,
  title,
  queryKey = 'sort',
}: {
  list: ListItem[]
  placeholder: string
  title?: string
  queryKey?: string
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [active, setActive] = useState('')

  useEffect(() => {
    list.forEach((listItem: ListItem) => {
      // For path-based items (like "All"), check if we're on that path AND the queryKey param is not set
      // For slug-based items, check if the query param matches the slug
      if (
        ('path' in listItem && pathname === listItem.path && !searchParams.get(queryKey)) ||
        ('slug' in listItem && searchParams.get(queryKey) === listItem.slug)
      ) {
        setActive(listItem.title)
      }
    })
  }, [pathname, list, searchParams, queryKey])

  const isActive = (item: ListItem) => {
    if ('path' in item && pathname === item.path && !searchParams.get(queryKey)) {
      return true
    }
    if ('slug' in item && searchParams.get(queryKey) === item.slug) {
      return true
    }
    return false
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant={'outline'} className="flex-1 text-left justify-start" />}
      >
        {active || placeholder}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-(--anchor-width)">
        <DropdownMenuGroup>
          {!!title && (
            <>
              <DropdownMenuLabel>{title}</DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}
          {list.map((item) => (
            <DropdownMenuItem
              key={item.title}
              className={cn(isActive(item) && 'bg-accent font-medium')}
              render={
                <Link
                  href={createUrl({
                    pathname,
                    listItem: item,
                    searchParams: new URLSearchParams(searchParams.toString()),
                    queryKey,
                  })}
                  className="flex items-center gap-2 justify-between w-full"
                >
                  {item.title}
                  <Check
                    className={cn(
                      'h-4 w-4 transition-opacity',
                      isActive(item) ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </Link>
              }
            />
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
