import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const TRENDING_PRODUCTS = [
  {
    id: '101',
    title: 'Urban Street Hoodie',
    price: 32000,
    category: 'Men',
    isHot: true,
  },
  {
    id: '102',
    title: 'High-Waist Jeans',
    price: 25000,
    category: 'Women',
    isHot: true,
  },
  {
    id: '103',
    title: 'Canvas Tote Bag',
    price: 12000,
    category: 'Accessories',
    isHot: false,
  },
  {
    id: '104',
    title: 'Minimalist Watch',
    price: 48000,
    category: 'Accessories',
    isHot: true,
  },
]

export function TrendingProducts() {
  return (
    <section className="py-16 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Trending Now</h2>
          <Link
            href="/shop?sort=popularity"
            className="text-sm font-medium text-primary hover:underline"
          >
            View All Trending
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRENDING_PRODUCTS.map((product) => (
            <Card key={product.id} className="group overflow-hidden">
              <CardContent className="p-0 aspect-[3/4] bg-muted relative flex items-center justify-center">
                {product.isHot && (
                  <Badge className="absolute top-2 right-2 z-10" variant="destructive">
                    Hot
                  </Badge>
                )}
                <span className="text-muted-foreground">Product Image</span>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
              </CardContent>
              <CardFooter className="flex flex-col items-start p-4 gap-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  {product.category}
                </div>
                <h3 className="font-medium text-base">{product.title}</h3>
                <div className="font-bold text-lg">₦{product.price.toLocaleString()}</div>
                <Button
                  className="w-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  size="sm"
                  asChild
                >
                  <Link href={`/products/${product.id}`}>Add to Cart</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
