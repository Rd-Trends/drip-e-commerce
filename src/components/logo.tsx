import Link from 'next/link'

export function Logo() {
  return (
    <Link href="/" className="font-bold text-xl no-underline select-none">
      Drip<span className="text-primary">.</span>
    </Link>
  )
}
