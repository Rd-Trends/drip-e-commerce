import type { Endpoint } from 'payload'

export const unsubscribeHandler: Endpoint['handler'] = async (req) => {
  const url = new URL(req.url ?? '')
  const userIdParam = url.searchParams.get('userId')
  const email = url.searchParams.get('email')
  const serverURL = req.payload.config.serverURL || ''
  const redirectBase = `${serverURL}/?unsubscribed`

  const userId = userIdParam ? Number(userIdParam) : NaN

  if (!email || isNaN(userId)) {
    return Response.redirect(`${redirectBase}=error`, 302)
  }

  try {
    const user = await req.payload.findByID({
      collection: 'users',
      id: userId,
      depth: 0,
      select: { email: true, marketingEmails: true },
    })

    if (!user || user.email !== email) {
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
