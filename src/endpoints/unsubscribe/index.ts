import type { Endpoint } from 'payload'
import crypto from 'crypto'

function verifyUnsubscribeToken(userId: number, email: string, token: string): boolean {
  const secret = process.env.PAYLOAD_SECRET ?? ''
  const expected = crypto.createHmac('sha256', secret).update(`${userId}:${email}`).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export const unsubscribeHandler: Endpoint['handler'] = async (req) => {
  const url = new URL(req.url ?? '')
  const userIdParam = url.searchParams.get('userId')
  const token = url.searchParams.get('token')
  const serverURL = req.payload.config.serverURL || ''
  const redirectBase = `${serverURL}/?unsubscribed`

  const userId = userIdParam ? Number(userIdParam) : NaN

  if (!token || isNaN(userId)) {
    return Response.redirect(`${redirectBase}=error`, 302)
  }

  try {
    const user = await req.payload.findByID({
      collection: 'users',
      id: userId,
      depth: 0,
      select: { email: true, marketingEmails: true },
    })

    if (!user?.email || !verifyUnsubscribeToken(userId, user.email, token)) {
      return Response.redirect(`${redirectBase}=error`, 302)
    }

    await req.payload.update({
      collection: 'users',
      id: userId,
      data: { marketingEmails: false } as never,
    })

    return Response.redirect(`${redirectBase}=1`, 302)
  } catch {
    return Response.redirect(`${redirectBase}=error`, 302)
  }
}
