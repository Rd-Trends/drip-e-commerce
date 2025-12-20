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

export function SizeGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Ruler className="h-6 w-6" />
          Size Guide
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="clothing" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clothing">Clothing</TabsTrigger>
            <TabsTrigger value="shoes">Shoes</TabsTrigger>
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
        </Tabs>
      </CardContent>
    </Card>
  )
}
