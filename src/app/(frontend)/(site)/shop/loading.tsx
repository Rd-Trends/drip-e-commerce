import { ProductGridItemSkeleton } from '@/components/product/grid-item'

export default function ShopLoading() {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-3 gap-2 gap-y-6 md:gap-6">
      {[...Array(9)].map((_, i) => (
        <ProductGridItemSkeleton key={i} />
      ))}
    </section>
  )
}
