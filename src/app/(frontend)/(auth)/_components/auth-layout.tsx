import { Logo } from '@/components/logo'

interface AuthLayoutProps {
  title: string
  description: string
  children: React.ReactNode
}

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <Logo />

          <h1 className="text-xl font-bold tracking-tight">{title}</h1>

          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </div>

        {children}
      </div>
    </div>
  )
}
