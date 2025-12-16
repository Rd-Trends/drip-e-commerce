'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { createUrl, ListItem } from './helper'

const FilterList = ({
  list,
  title,
  queryKey = 'sort',
}: {
  list: ListItem[]
  title?: string
  queryKey?: string
}) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <div>
      {title ? (
        <h3 className="hidden text-xs text-neutral-500 md:block dark:text-neutral-400 pb-2">
          {title}
        </h3>
      ) : null}
      <ul className="list-none p-0 m-0 hidden md:flex flex-col gap-2 ">
        {list.map((item) => {
          const active = item.path
            ? pathname === item.path
            : searchParams.get(queryKey) === item.slug

          return (
            <li key={item.title} className="text-sm text-black dark:text-white">
              {active ? (
                <p className="underline underline-offset-4">{item.title}</p>
              ) : (
                <Link
                  href={createUrl({
                    pathname,
                    listItem: item,
                    searchParams: new URLSearchParams(searchParams.toString()),
                    queryKey,
                  })}
                  className="hover:underline hover:underline-offset-4 inline-block"
                >
                  {item.title}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const FilterListLoader = ({ title }: { title?: string }) => {
  return (
    <div>
      {title ? (
        <h3 className="hidden text-xs text-neutral-500 md:block dark:text-neutral-400 pb-2">
          {title}
        </h3>
      ) : null}
      <ul className="list-none p-0 m-0 hidden md:flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <li key={index} className="text-sm text-black dark:text-white">
            <Skeleton className="w-full h-4" />
          </li>
        ))}
      </ul>
    </div>
  )
}

export { FilterList, FilterListLoader }
