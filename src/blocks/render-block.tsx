import { CallToActionBlock } from '@/blocks/call-to-action/component'
import { ContentBlock } from '@/blocks/content/component'
import { FormBlock } from '@/blocks/forms/component'
import { FAQBlock } from '@/blocks/faqs/component'
import React, { Fragment } from 'react'

import type { Page } from '../payload-types'

const blockComponents = {
  cta: CallToActionBlock,
  content: ContentBlock,
  faq: FAQBlock,
  formBlock: FormBlock,
}

export const RenderBlocks: React.FC<{
  blocks: Page['content'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              return (
                <Fragment key={String(index)}>
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                  {/* @ts-ignore - weird type mismatch here */}
                  <Block {...block} className={index > 0 ? 'mt-8' : undefined} />
                </Fragment>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
