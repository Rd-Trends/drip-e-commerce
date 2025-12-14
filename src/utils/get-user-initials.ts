export const getUserInitials = (name: string | null | undefined): string => {
  if (!name) return 'UN'
  const names = name.split(' ')
  const firstName = names[0]
  const lastName = names.length > 1 ? names[names.length - 1] : ''
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}
