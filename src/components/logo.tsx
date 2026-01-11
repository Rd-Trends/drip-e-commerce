import Link from 'next/link'
import { SVGProps } from 'react'

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold text-xl no-underline select-none">
      <LogoIcon className="h-8 w-auto text-primary" />{' '}
      <span className="inline-block select-none -mt-1.5">Drip</span>
    </Link>
  )
}

export const LogoIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={416} height={285} viewBox="0 0 416 285" {...props}>
    <path
      fill="currentColor"
      d="m25 25 60.625-2.875 18.823-1.269c26.925-1.11 52.119.938 73.028 19.834 19.822 18.633 24.047 40.377 24.885 66.805.375 17.017-.232 34-1.048 50.995-.523 11.09-.769 22.183-.998 33.282-.476 22.756-1.28 45.49-2.315 68.228l-2.902-2.545c-2.799-2.404-5.666-4.665-8.622-6.873-16.5-12.467-35.62-27.173-39.264-48.65-.752-6.689-1.005-13.285-.942-20.006l.017-2.057c.1-8.4.536-16.77 1.106-25.149.77-11.378 1.185-22.774 1.526-34.172.147-4.611.437-9.2.768-13.803 1.01-14.158 1.01-14.158-4.949-26.534-6.08-6.133-12.085-8.82-20.828-8.949l-3.84.152-3.65-.017c-4.433 0-8.864.12-13.295.228L73 72v77h63v48H25V25Zm305.375-2.875L391 25v172H281v-48h62V72l-30.125-.375-9.422-.228c-2.508 0-5.016.005-7.523.017l-3.84-.152c-8.751.13-14.757 2.825-20.843 8.964-7.116 8.75-5.331 19.565-4.482 30.157.308 3.977.516 7.952.684 11.937l.087 2.06.175 4.173c.09 2.126.189 4.25.29 6.376 3.715 78.957 3.715 78.957-15.57 100.437-3.112 3.252-6.437 6.176-9.931 9.009l-1.697 1.38C222.977 260 222.977 260 218 260a2881.556 2881.556 0 0 1-2.383-71.544c-.235-11.087-.556-22.159-1.087-33.236-3.946-84.1-3.946-84.1 18.147-108.734 27.121-28.66 60.923-26.84 97.698-24.361Z"
    />
  </svg>
)

export const AdminLogoIcon = () => {
  return <LogoIcon style={{ height: 'auto', width: '18px' }} />
}

export const AdminLogo = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontWeight: 'bold',
        fontSize: '2.5rem',
      }}
    >
      <LogoIcon style={{ height: '42px', width: 'auto' }} />

      <span
        style={{
          display: 'inline-block',
          marginTop: '-8px',
          userSelect: 'none',
        }}
      >
        Drip
      </span>
    </div>
  )
}
