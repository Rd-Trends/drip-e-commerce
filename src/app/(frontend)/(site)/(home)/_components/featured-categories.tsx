import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'

const CATEGORIES = [
  {
    id: '1',
    title: 'Men',
    href: '/shop?category=men',
    image: '/media/category-men.jpg', // Dummy path
    color: 'bg-blue-100 dark:bg-blue-950',
  },
  {
    id: '2',
    title: 'Women',
    href: '/shop?category=women',
    image: '/media/category-women.jpg', // Dummy path
    color: 'bg-pink-100 dark:bg-pink-950',
  },
  {
    id: '3',
    title: 'Accessories',
    href: '/shop?category=accessories',
    image: '/media/category-accessories.jpg', // Dummy path
    color: 'bg-amber-100 dark:bg-amber-950',
  },
  {
    id: '4',
    title: 'Footwear',
    href: '/shop?category=footwear',
    image: '/media/category-footwear.jpg', // Dummy path
    color: 'bg-slate-100 dark:bg-slate-900',
  },
]

export function FeaturedCategories() {
  return (
    <section className="py-16 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Shop by Category</h2>
          <Link
            href="/shop"
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((category) => (
            <Link key={category.id} href={category.href} className="group">
              <Card className="overflow-hidden border-none shadow-none h-full">
                <CardContent className="p-0 relative aspect-4/5">
                  <div
                    className={`w-full h-full ${category.color} flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}
                  >
                    {/* Placeholder for image */}
                    <span className="text-4xl font-bold opacity-20">{category.title}</span>
                  </div>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-xl font-bold text-white">{category.title}</h3>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
