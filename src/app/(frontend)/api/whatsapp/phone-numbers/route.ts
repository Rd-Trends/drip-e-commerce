import { NextRequest, NextResponse } from 'next/server'

const API_VERSION = 'v25.0'

export async function GET(req: NextRequest) {
  const wabaId = 1408150230910500
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

  const url = `https://graph.facebook.com/${API_VERSION}/${wabaId}/phone_numbers?access_token=${accessToken}`

  try {
    const res = await fetch(url, { cache: 'no-store' })
    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? 'Meta API error', details: data },
        { status: res.status },
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected server error' },
      { status: 500 },
    )
  }
}
