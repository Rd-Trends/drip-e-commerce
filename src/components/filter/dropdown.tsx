'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createUrl, ListItem } from './helper'

export default function FilterDropdown({
  list,
  placeholder,
  title,
}: {
  list: ListItem[]
  placeholder: string
  title?: string
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [active, setActive] = useState('')

  useEffect(() => {
    list.forEach((listItem: ListItem) => {
      if (
        ('path' in listItem && pathname === listItem.path) ||
        ('slug' in listItem && searchParams.get('sort') === listItem.slug)
      ) {
        setActive(listItem.title)
      }
    })
  }, [pathname, list, searchParams])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={'outline'} className="flex-1 text-left justify-start">
          {active || placeholder}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {!!title && (
          <>
            <DropdownMenuLabel>{title}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        {list.map((item) => (
          <DropdownMenuItem key={item.title} asChild>
            <Link
              href={createUrl({
                pathname,
                listItem: item,
                searchParams: new URLSearchParams(searchParams.toString()),
              })}
            >
              {item.title}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
