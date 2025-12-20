'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Truck, CheckCircle } from 'lucide-react'
import React from 'react'

const shippingSteps = [
  {
    icon: Package,
    title: 'Order Processing',
    description: '1-2 business days',
    details: 'Your order is carefully prepared and packaged',
  },
  {
    icon: Truck,
    title: 'In Transit',
    description: '3-5 business days',
    details: 'Your package is on its way to you',
  },
  {
    icon: CheckCircle,
    title: 'Delivered',
    description: 'Total: 4-7 business days',
    details: 'Your order arrives at your doorstep',
  },
]

export function ShippingTimeline() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Shipping Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {shippingSteps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  {index < shippingSteps.length - 1 && (
                    <div className="h-full w-0.5 flex-1 bg-border mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <h3 className="font-semibold text-lg">{step.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium">{step.description}</p>
                  <p className="text-sm text-muted-foreground mt-1">{step.details}</p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-6 rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Delivery times may vary based on your location. Express shipping
            options are available at checkout.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
