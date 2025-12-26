import { Home, Media } from '@/payload-types'

export const homeGlobal = ({
  heroImage,
}: {
  heroImage: Media
}): Omit<Home, 'id' | 'createdAt' | 'updatedAt'> => {
  return {
    heroSlides: [
      {
        title: 'Discover Your Style',
        badge: 'New Arrival',
        description:
          'Explore the latest trends in fashion and find your perfect look with our new collection.',
        image: heroImage.id,
        links: [
          {
            link: {
              url: '/shop',
              label: 'Shop Now',
            },
          },
        ],
      },
    ],
    productSections: [
      { title: 'Featured Products', type: 'featured' },
      { title: 'Latest Arrivals', type: 'latest' },
    ],
  }
}
