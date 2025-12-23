import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function MobileSearch() {
  return (
    <div className="p-4 md:hidden">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search for products, categories, brands..."
          className="w-full bg-muted pl-8 rounded-lg"
        />
      </div>
    </div>
  )
}
