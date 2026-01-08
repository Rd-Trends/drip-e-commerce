export type ListItem = {
  title: string
  slug?: string | null
  path?: string
}

export const createUrl = (params: {
  pathname: string
  listItem: ListItem
  searchParams: URLSearchParams
  queryKey?: string
}) => {
  const { pathname, listItem, searchParams, queryKey = 'sort' } = params

  // Reset pagination when any filter changes
  searchParams.delete('page')

  if (listItem.path) {
    searchParams.delete(queryKey)
    return `${listItem.path}?${searchParams.toString()}`
  }
  if (listItem.slug) {
    searchParams.set(queryKey, listItem.slug)
    return `${pathname}?${searchParams.toString()}`
  }

  searchParams.delete(queryKey)
  return `${pathname}?${searchParams.toString()}`
}
