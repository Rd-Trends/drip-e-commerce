export type ListItem = {
  title: string
  slug?: string | null
  path?: string
}

export const createUrl = (params: {
  pathname: string
  listItem: ListItem
  searchParams: URLSearchParams
}) => {
  const { pathname, listItem, searchParams } = params
  if (listItem.path) {
    searchParams.delete('q')
    return `${listItem.path}?${searchParams.toString()}`
  }
  if (listItem.slug) {
    searchParams.set('sort', listItem.slug)
    return `${pathname}?${searchParams.toString()}`
  }

  searchParams.delete('sort')
  return `${pathname}?${searchParams.toString()}`
}
