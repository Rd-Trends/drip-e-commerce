import { NextRequest, NextResponse } from 'next/server'

const GRAPH_API_VERSION = 'v25.0'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phoneNumberId, pin } = body
    const wabaId = 1408150230910500
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

    if (!phoneNumberId || !accessToken || !pin) {
      return NextResponse.json(
        { error: 'phoneNumberId, accessToken, and pin are required.' },
        { status: 400 },
      )
    }

    if (!/^\d{6}$/.test(pin)) {
      return NextResponse.json({ error: 'pin must be exactly 6 digits.' }, { status: 400 })
    }

    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/register`

    const graphRes = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        pin,
      }),
    })

    const data = await graphRes.json()

    return NextResponse.json(data, { status: graphRes.status })
  } catch (error) {
    console.error('[whatsapp/register]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error.' },
      { status: 500 },
    )
  }
}
