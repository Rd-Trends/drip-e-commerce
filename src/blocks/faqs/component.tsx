import React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { RichText } from '@/components/rich-text'
import Container from '@/components/layout/container'
import Section from '@/components/layout/section'
import type { FAQBlock as FAQBlockProps } from '@/payload-types'

export const FAQBlock: React.FC<
  FAQBlockProps & {
    id?: string | number
    className?: string
  }
> = ({ title, description, faqs }) => {
  return (
    <Section paddingY="none">
      <Container>
        {(title || description) && (
          <div className="mb-8 text-center">
            {title && <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>}
            {description && <p className="mt-4 text-lg text-muted-foreground">{description}</p>}
          </div>
        )}

        <Accordion className="w-full">
          {faqs?.map((faq, index) => (
            <AccordionItem key={faq.id || index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
              <AccordionContent>
                <RichText className="mb-0 mt-0" data={faq.answer} enableGutter={false} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Container>
    </Section>
  )
}
