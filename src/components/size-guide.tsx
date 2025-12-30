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

// Data
const clothingSizes = [
  { size: 'XS', chest: '86-91', waist: '71-76', length: '68-70' },
  { size: 'S', chest: '91-96', waist: '76-81', length: '70-72' },
  { size: 'M', chest: '96-101', waist: '81-86', length: '72-74' },
  { size: 'L', chest: '101-106', waist: '86-91', length: '74-76' },
  { size: 'XL', chest: '106-111', waist: '91-96', length: '76-78' },
  { size: 'XXL', chest: '111-117', waist: '96-102', length: '78-80' },
]

const waistSizes = [
  { waist: '28', hips: '89-92', inseam: '76-81' },
  { waist: '30', hips: '92-97', inseam: '76-81' },
  { waist: '32', hips: '97-102', inseam: '81-86' },
  { waist: '34', hips: '102-107', inseam: '81-86' },
  { waist: '36', hips: '107-112', inseam: '81-86' },
  { waist: '38', hips: '112-117', inseam: '81-86' },
  { waist: '40', hips: '117-122', inseam: '81-86' },
  { waist: '42', hips: '122-127', inseam: '81-86' },
]

const shoeSizes = [
  { eu: '40', uk: '6', us: '7', cm: '25' },
  { eu: '41', uk: '7', us: '8', cm: '25.5' },
  { eu: '42', uk: '8', us: '9', cm: '26.5' },
  { eu: '43', uk: '9', us: '10', cm: '27' },
  { eu: '44', uk: '10', us: '11', cm: '27.5' },
  { eu: '45', uk: '11', us: '12', cm: '28' },
  { eu: '46', uk: '11.5', us: '12.5', cm: '28.5' },
]

const beltSizes = [
  { waist: '28-30', size: 'S', length: '95' },
  { waist: '32-34', size: 'M', length: '100' },
  { waist: '36-38', size: 'L', length: '105' },
  { waist: '40-42', size: 'XL', length: '110' },
]

const capSizes = [
  { size: 'One Size', circumference: '54-60', description: 'Adjustable strap' },
  { size: 'S/M', circumference: '54-57', description: 'Fitted or snapback' },
  { size: 'L/XL', circumference: '58-61', description: 'Fitted or snapback' },
]

const bagSizes = [
  { size: 'Small', dimensions: '25 x 20 x 10 cm', use: 'Everyday essentials' },
  { size: 'Medium', dimensions: '35 x 28 x 15 cm', use: 'Daily commute, gym' },
  { size: 'Large', dimensions: '45 x 35 x 20 cm', use: 'Travel, sports gear' },
]

// Individual Size Guide Components
export function ClothingSizeGuide() {
  return (
    <div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Size</TableHead>
              <TableHead className="font-semibold">Chest (cm)</TableHead>
              <TableHead className="font-semibold">Waist (cm)</TableHead>
              <TableHead className="font-semibold">Length (cm)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clothingSizes.map((row) => (
              <TableRow key={row.size}>
                <TableCell className="font-medium">{row.size}</TableCell>
                <TableCell>{row.chest}</TableCell>
                <TableCell>{row.waist}</TableCell>
                <TableCell>{row.length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4 rounded-lg bg-muted p-4">
        <p className="text-sm text-muted-foreground">
          <strong>How to measure:</strong> Measure chest at fullest point, waist at natural
          waistline, and length from shoulder to hem. Take measurements with minimal clothing.
        </p>
      </div>
    </div>
  )
}

export function BottomsSizeGuide() {
  return (
    <div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Waist</TableHead>
              <TableHead className="font-semibold">Hips (cm)</TableHead>
              <TableHead className="font-semibold">Inseam (cm)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {waistSizes.map((row) => (
              <TableRow key={row.waist}>
                <TableCell className="font-medium">{row.waist}</TableCell>
                <TableCell>{row.hips}</TableCell>
                <TableCell>{row.inseam}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4 rounded-lg bg-muted p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Fit guide:</strong> Waist measurement is in inches. Measure around your natural
          waistline. For jeans, inseam is the inside leg measurement from crotch to ankle.
        </p>
      </div>
    </div>
  )
}

export function ShoesSizeGuide() {
  return (
    <div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">EU</TableHead>
              <TableHead className="font-semibold">UK</TableHead>
              <TableHead className="font-semibold">US</TableHead>
              <TableHead className="font-semibold">CM</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shoeSizes.map((row) => (
              <TableRow key={row.eu}>
                <TableCell className="font-medium">{row.eu}</TableCell>
                <TableCell>{row.uk}</TableCell>
                <TableCell>{row.us}</TableCell>
                <TableCell>{row.cm}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4 rounded-lg bg-muted p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Tip:</strong> Measure your foot length in centimeters. If between sizes, size up
          for comfort. Our sizes are unisex.
        </p>
      </div>
    </div>
  )
}

export function BeltsSizeGuide() {
  return (
    <div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Waist (inches)</TableHead>
              <TableHead className="font-semibold">Size</TableHead>
              <TableHead className="font-semibold">Belt Length (cm)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {beltSizes.map((row) => (
              <TableRow key={row.size}>
                <TableCell className="font-medium">{row.waist}</TableCell>
                <TableCell>{row.size}</TableCell>
                <TableCell>{row.length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4 rounded-lg bg-muted p-4">
        <p className="text-sm text-muted-foreground">
          <strong>How to measure:</strong> Measure around your waist where you normally wear your
          belt. Order one size up from your pant waist size for best fit.
        </p>
      </div>
    </div>
  )
}

export function CapsSizeGuide() {
  return (
    <div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Size</TableHead>
              <TableHead className="font-semibold">Circumference (cm)</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {capSizes.map((row) => (
              <TableRow key={row.size}>
                <TableCell className="font-medium">{row.size}</TableCell>
                <TableCell>{row.circumference}</TableCell>
                <TableCell>{row.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4 rounded-lg bg-muted p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Measuring tip:</strong> Measure around your head just above the ears. Most caps
          have adjustable straps for a custom fit.
        </p>
      </div>
    </div>
  )
}

export function BagsSizeGuide() {
  return (
    <div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Size</TableHead>
              <TableHead className="font-semibold">Dimensions</TableHead>
              <TableHead className="font-semibold">Best For</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bagSizes.map((row) => (
              <TableRow key={row.size}>
                <TableCell className="font-medium">{row.size}</TableCell>
                <TableCell>{row.dimensions}</TableCell>
                <TableCell>{row.use}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4 rounded-lg bg-muted p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Dimensions:</strong> Listed as Length x Height x Width. Choose based on your daily
          needs and what you typically carry.
        </p>
      </div>
    </div>
  )
}

// Main Product Size Guide Component (for product details page)
type SizeGuideProps = {
  product?: Product
  categories?: (Category | number)[]
}

export function SizeGuide({ product, categories }: SizeGuideProps) {
  const categoryNames = React.useMemo(() => {
    const cats = categories || product?.categories || []
    return cats
      .map((cat) => {
        if (typeof cat !== 'number') {
          return cat.title.toLowerCase()
        }
        return ''
      })
      .filter(Boolean)
  }, [categories, product])

  const availableTabs = React.useMemo(() => {
    const clothingPatterns =
      /(shirt|polo|hoodie|jacket|jersey|t-shirt|tshirt|tee|sweater|cardigan|vest|blazer|coat|pullover|sweatshirt|top)/i
    const bottomsPatterns = /(jean|short|pant|trouser|jogger|sweatpant|chino|cargo|track)/i
    const shoePatterns = /(shoe|sneaker|boot|sandal|slipper|footwear|trainer|runner|loafer|slide)/i
    const beltPatterns = /(belt|strap|waistband)/i
    const capPatterns = /(cap|hat|beanie|snapback|bucket|fedora|headwear)/i
    const bagPatterns =
      /(bag|backpack|tote|satchel|duffel|messenger|pouch|sling|crossbody|handbag)/i

    const categoryString = categoryNames.join(' ')

    const isClothing = clothingPatterns.test(categoryString)
    const isBottoms = bottomsPatterns.test(categoryString)
    const isShoes = shoePatterns.test(categoryString)
    const isBelt = beltPatterns.test(categoryString)
    const isCap = capPatterns.test(categoryString)
    const isBag = bagPatterns.test(categoryString)

    const tabs: Array<{ value: string; label: string }> = []

    if (isClothing) tabs.push({ value: 'clothing', label: 'Tops' })
    if (isBottoms) tabs.push({ value: 'bottoms', label: 'Bottoms' })
    if (isShoes) tabs.push({ value: 'shoes', label: 'Footwear' })
    if (isBelt) tabs.push({ value: 'belts', label: 'Belts' })
    if (isCap) tabs.push({ value: 'caps', label: 'Caps' })
    if (isBag) tabs.push({ value: 'bags', label: 'Bags' })

    if (tabs.length === 0) {
      tabs.push(
        { value: 'clothing', label: 'Tops' },
        { value: 'bottoms', label: 'Bottoms' },
        { value: 'shoes', label: 'Footwear' },
        { value: 'belts', label: 'Belts' },
        { value: 'caps', label: 'Caps' },
        { value: 'bags', label: 'Bags' },
      )
    }

    return tabs
  }, [categoryNames])

  const defaultTab = availableTabs[0].value

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
          {availableTabs.length > 1 && (
            <TabsList className="mb-4">
              {availableTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          )}

          <TabsContent value="clothing">
            <ClothingSizeGuide />
          </TabsContent>

          <TabsContent value="bottoms">
            <BottomsSizeGuide />
          </TabsContent>

          <TabsContent value="shoes">
            <ShoesSizeGuide />
          </TabsContent>

          <TabsContent value="belts">
            <BeltsSizeGuide />
          </TabsContent>

          <TabsContent value="caps">
            <CapsSizeGuide />
          </TabsContent>

          <TabsContent value="bags">
            <BagsSizeGuide />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
