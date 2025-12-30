import type { Metadata } from 'next'

import { LivePreviewListener } from '@/components/live-preview-listener'
import { RenderBlocks } from '@/blocks/render-block'
// import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utils/generate-meta'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const pages = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = pages.docs
    ?.filter((doc) => {
      return doc.slug !== 'home'
    })
    .map(({ slug }) => {
      return { slug }
    })

  return params
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Page({ params }: Args) {
  const { slug = 'home' } = await params

  const page = await queryPageBySlug({
    slug,
  })

  if (!page) {
    return notFound()
  }

  const { content } = page

  return (
    <Fragment>
      <LivePreviewListener />
      <article className="pt-16 pb-24">
        <RenderBlocks blocks={content} />
      </article>
    </Fragment>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug = 'home' } = await params

  const page = await queryPageBySlug({
    slug,
  })

  if (!page) {
    return {}
  }

  return generateMeta({ doc: page })
}

const queryPageBySlug = async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'pages',
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
        ...(draft ? [] : [{ _status: { equals: 'published' } }]),
      ],
    },
  })

  return result.docs?.[0] || null
}
