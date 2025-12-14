'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Star } from 'lucide-react'
import React from 'react'

interface Review {
  id: string
  author: string
  rating: number
  comment: string
  avatar?: string
}

// Dummy data
const DUMMY_REVIEWS: Review[] = [
  {
    id: '1',
    author: 'Emily Selman',
    rating: 5,
    comment:
      'This is the bag of my dreams. I took it on my last vacation and was able to fit an absurd amount of snacks for the many long and hungry flights.',
    avatar: '👩‍🦰',
  },
  {
    id: '2',
    author: 'Hector Gibbons',
    rating: 5,
    comment:
      'Before getting the Ruck Snack, I struggled my whole life with pulverized snacks, endless crumbs, and other heartbreaking snack catastrophes. Now, I can stow my snacks with confidence and style!',
    avatar: '👨',
  },
  {
    id: '3',
    author: 'Mark Edwards',
    rating: 4,
    comment:
      'I love how versatile this bag is. It can hold anything ranging from cookies that come in trays to cookies that come in tins.',
    avatar: '👨‍💼',
  },
]

const RATING_DISTRIBUTION = [
  { stars: 5, percentage: 63 },
  { stars: 4, percentage: 10 },
  { stars: 3, percentage: 6 },
  { stars: 2, percentage: 12 },
  { stars: 1, percentage: 9 },
]

const TOTAL_REVIEWS = 1624
const AVERAGE_RATING = 4.0

export function ProductReviews({ productId }: { productId: number }) {
  return (
    <div className="w-full">
      <h2 className="mb-8 text-3xl font-bold">Customer Reviews</h2>

      <div className="grid gap-6 md:gap-8 xl:gap-10 lg:grid-cols-[400px_1fr]">
        {/* Left column - Rating summary */}
        <div className="space-y-6">
          {/* Overall rating */}
          <div>
            <div className="mb-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-6 w-6 ${
                    star <= Math.floor(AVERAGE_RATING)
                      ? 'fill-yellow-400 text-yellow-400'
                      : star === Math.ceil(AVERAGE_RATING)
                        ? 'fill-yellow-400/50 text-yellow-400'
                        : 'fill-muted text-muted'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Based on {TOTAL_REVIEWS} reviews</p>
          </div>

          {/* Rating distribution */}
          <div className="space-y-2">
            {RATING_DISTRIBUTION.map(({ stars, percentage }) => (
              <div key={stars} className="flex items-center gap-2">
                <div className="flex w-8 items-center gap-1">
                  <span className="text-sm font-medium">{stars}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-yellow-400" style={{ width: `${percentage}%` }} />
                </div>
                <span className="w-12 text-sm text-muted-foreground">{percentage}%</span>
              </div>
            ))}
          </div>

          {/* Write a review */}
          <div className="space-y-2 rounded-lg border p-4">
            <h3 className="font-semibold">Share your thoughts</h3>
            <p className="text-sm text-muted-foreground">
              If you&apos;ve used this product, share your thoughts with other customers
            </p>
            <Button variant="outline" className="w-full">
              Write a review
            </Button>
          </div>
        </div>

        {/* Right column - Reviews list */}
        <div className="w-full flex flex-col gap-6 divide-y divide-border">
          {DUMMY_REVIEWS.map((review) => (
            <article className="pb-6" key={review.id}>
              <div className="mb-4 flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-2xl">
                  {review.avatar}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{review.author}</h4>
                  <div className="mt-1 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-muted text-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm italic text-muted-foreground">{review.comment}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
