import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

const NEW_ARRIVALS = [
  {
    id: '1',
    title: 'Classic Denim Jacket',
    price: 45000,
    image: '/media/product-1.jpg',
    category: 'Men',
  },
  {
    id: '2',
    title: 'Floral Summer Dress',
    price: 35000,
    image: '/media/product-2.jpg',
    category: 'Women',
  },
  {
    id: '3',
    title: 'Leather Crossbody Bag',
    price: 28000,
    image: '/media/product-3.jpg',
    category: 'Accessories',
  },
  {
    id: '4',
    title: 'Running Sneakers',
    price: 55000,
    image: '/media/product-4.jpg',
    category: 'Footwear',
  },
  {
    id: '5',
    title: 'Cotton Graphic Tee',
    price: 15000,
    image: '/media/product-5.jpg',
    category: 'Men',
  },
]

export function NewArrivals() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight mb-2">New Arrivals</h2>
          <p className="text-muted-foreground max-w-2xl">
            Check out the latest additions to our collection. Fresh styles just for you.
          </p>
        </div>

        <Carousel
          opts={{
            align: 'start',
          }}
          className="w-full max-w-5xl mx-auto"
        >
          <CarouselContent>
            {NEW_ARRIVALS.map((product) => (
              <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <Card className="h-full flex flex-col">
                    <CardContent className="p-0 aspect-square bg-muted relative flex items-center justify-center">
                      <span className="text-muted-foreground">Product Image</span>
                    </CardContent>
                    <CardFooter className="flex flex-col items-start p-4 gap-2 flex-grow">
                      <div className="text-sm text-muted-foreground">{product.category}</div>
                      <h3 className="font-semibold text-lg line-clamp-1">{product.title}</h3>
                      <div className="font-bold mt-auto">₦{product.price.toLocaleString()}</div>
                      <Button className="w-full mt-2" variant="secondary" asChild>
                        <Link href={`/products/${product.id}`}>View Details</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  )
}
