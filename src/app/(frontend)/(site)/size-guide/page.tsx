import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ClothingSizeGuide,
  BottomsSizeGuide,
  ShoesSizeGuide,
  BeltsSizeGuide,
  CapsSizeGuide,
  BagsSizeGuide,
} from '@/components/size-guide'
import Section from '@/components/layout/section'
import Container from '@/components/layout/container'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Size Guide - Clothing & Accessories',
  description:
    'Find your perfect fit with our comprehensive sizing charts for clothing, shoes, accessories, and more. Detailed measurements for all product categories.',
}

export default function SizeGuidePage() {
  return (
    <Section paddingY="xs">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Size Guide</h1>
          <p className="text-muted-foreground">
            Find the perfect fit with our comprehensive sizing charts for all product categories.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="clothing" className="w-full">
              <TabsList className="mb-6 grid grid-cols-3 lg:grid-cols-6 w-full">
                <TabsTrigger value="clothing">Tops</TabsTrigger>
                <TabsTrigger value="bottoms">Bottoms</TabsTrigger>
                <TabsTrigger value="shoes">Footwear</TabsTrigger>
                <TabsTrigger value="belts">Belts</TabsTrigger>
                <TabsTrigger value="caps">Caps</TabsTrigger>
                <TabsTrigger value="bags">Bags</TabsTrigger>
              </TabsList>

              <TabsContent value="clothing">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Tops & Clothing Size Guide</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Sizing for shirts, polos, hoodies, jackets, jerseys, and more
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ClothingSizeGuide />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bottoms">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Bottoms Size Guide</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Sizing for jeans, shorts, pants, and trousers
                    </p>
                  </CardHeader>
                  <CardContent>
                    <BottomsSizeGuide />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="shoes">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Footwear Size Guide</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      International shoe sizing for sneakers, boots, and more
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ShoesSizeGuide />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="belts">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Belt Size Guide</CardTitle>
                    <p className="text-sm text-muted-foreground">Find your perfect belt size</p>
                  </CardHeader>
                  <CardContent>
                    <BeltsSizeGuide />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="caps">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Caps & Headwear Size Guide</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Sizing for caps, hats, and other headwear
                    </p>
                  </CardHeader>
                  <CardContent>
                    <CapsSizeGuide />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bags">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Bags Size Guide</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Dimensions and uses for backpacks, totes, and bags
                    </p>
                  </CardHeader>
                  <CardContent>
                    <BagsSizeGuide />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>General Measuring Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                • Always measure with minimal clothing on for accurate results
              </p>
              <p className="text-sm text-muted-foreground">
                • Keep the measuring tape parallel to the floor
              </p>
              <p className="text-sm text-muted-foreground">
                • If between sizes, we recommend sizing up for comfort
              </p>
              <p className="text-sm text-muted-foreground">
                • Measurements may vary slightly between brands
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Still Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Our customer service team is here to help you find the perfect fit.
              </p>
              <p className="text-sm text-muted-foreground">
                Contact us via email or live chat for personalized sizing recommendations.
              </p>
            </CardContent>
          </Card>
        </div>
      </Container>
    </Section>
  )
}
