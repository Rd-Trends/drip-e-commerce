'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Category, Product } from '@/payload-types'
import { Ruler } from 'lucide-react'
import React from 'react'

const clothingSizes = [
  { size: 'XS', chest: '86-91', waist: '71-76', hips: '91-96' },
  { size: 'S', chest: '91-96', waist: '76-81', hips: '96-101' },
  { size: 'M', chest: '96-101', waist: '81-86', hips: '101-106' },
  { size: 'L', chest: '101-106', waist: '86-91', hips: '106-111' },
  { size: 'XL', chest: '106-111', waist: '91-96', hips: '111-116' },
  { size: 'XXL', chest: '111-117', waist: '96-102', hips: '116-122' },
]

const shoeSizes = [
  { us: '7', uk: '6', eu: '40', cm: '25' },
  { us: '8', uk: '7', eu: '41', cm: '25.5' },
  { us: '9', uk: '8', eu: '42', cm: '26' },
  { us: '10', uk: '9', eu: '43', cm: '27' },
  { us: '11', uk: '10', eu: '44', cm: '27.5' },
  { us: '12', uk: '11', eu: '45', cm: '28' },
]

const accessoriesSizes = [
  { size: 'One Size', description: 'Adjustable or universal fit' },
  { size: 'S/M', description: 'Suitable for smaller builds' },
  { size: 'M/L', description: 'Suitable for medium to larger builds' },
]

const bagSizes = [
  { size: 'Small', dimensions: '20 x 15 x 10 cm', capacity: '5-10L' },
  { size: 'Medium', dimensions: '30 x 25 x 15 cm', capacity: '15-20L' },
  { size: 'Large', dimensions: '40 x 35 x 20 cm', capacity: '25-35L' },
]

type SizeGuideProps = {
  product?: Product
  categories?: (Category | number)[]
}

export function SizeGuide({ product, categories }: SizeGuideProps) {
  // Determine which tabs to show based on product categories
  const categoryNames = React.useMemo(() => {
    const cats = categories || product?.categories || []
    return cats
      .map((cat) => {
        if (typeof cat === 'object' && 'title' in cat) {
          return cat.title.toLowerCase()
        }
        return ''
      })
      .filter(Boolean)
  }, [categories, product])

  const isShoes = categoryNames.some((name) => name.includes('shoe') || name.includes('footwear'))
  const isBag = categoryNames.some((name) => name.includes('bag') || name.includes('backpack'))
  const isAccessory = categoryNames.some((name) => name.includes('accessor'))

  // Determine default tab and available tabs
  let defaultTab = 'clothing'
  const availableTabs: Array<{ value: string; label: string }> = []

  if (isShoes) {
    defaultTab = 'shoes'
    availableTabs.push({ value: 'shoes', label: 'Shoes' })
  } else if (isBag) {
    defaultTab = 'bags'
    availableTabs.push({ value: 'bags', label: 'Bags' })
  } else if (isAccessory) {
    defaultTab = 'accessories'
    availableTabs.push({ value: 'accessories', label: 'Accessories' })
  } else {
    availableTabs.push({ value: 'clothing', label: 'Clothing' })
  }

  // Always add other common tabs if not the default
  if (!isShoes) {
    availableTabs.push({ value: 'shoes', label: 'Shoes' })
  }
  if (!isBag && !isAccessory) {
    availableTabs.push({ value: 'accessories', label: 'Accessories' })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Ruler className="h-6 w-6" />
          Size Guide
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className={`grid w-full grid-cols-${availableTabs.length}`}>
            {availableTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="clothing" className="mt-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Size</TableHead>
                    <TableHead className="font-semibold">Chest (cm)</TableHead>
                    <TableHead className="font-semibold">Waist (cm)</TableHead>
                    <TableHead className="font-semibold">Hips (cm)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clothingSizes.map((row) => (
                    <TableRow key={row.size}>
                      <TableCell className="font-medium">{row.size}</TableCell>
                      <TableCell>{row.chest}</TableCell>
                      <TableCell>{row.waist}</TableCell>
                      <TableCell>{row.hips}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                <strong>How to measure:</strong> Measurements should be taken with minimal clothing.
                Use a soft tape measure and keep it parallel to the floor.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="shoes" className="mt-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">US</TableHead>
                    <TableHead className="font-semibold">UK</TableHead>
                    <TableHead className="font-semibold">EU</TableHead>
                    <TableHead className="font-semibold">CM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shoeSizes.map((row) => (
                    <TableRow key={row.us}>
                      <TableCell className="font-medium">{row.us}</TableCell>
                      <TableCell>{row.uk}</TableCell>
                      <TableCell>{row.eu}</TableCell>
                      <TableCell>{row.cm}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> If you're between sizes, we recommend sizing up for a more
                comfortable fit.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="accessories" className="mt-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Size</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessoriesSizes.map((row) => (
                    <TableRow key={row.size}>
                      <TableCell className="font-medium">{row.size}</TableCell>
                      <TableCell>{row.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Most accessories are designed to be adjustable or have
                flexible sizing to fit most customers.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="bags" className="mt-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Size</TableHead>
                    <TableHead className="font-semibold">Dimensions</TableHead>
                    <TableHead className="font-semibold">Capacity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bagSizes.map((row) => (
                    <TableRow key={row.size}>
                      <TableCell className="font-medium">{row.size}</TableCell>
                      <TableCell>{row.dimensions}</TableCell>
                      <TableCell>{row.capacity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Capacity guide:</strong> Dimensions are approximate (L x H x W). Actual
                capacity may vary based on contents and packing method.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
