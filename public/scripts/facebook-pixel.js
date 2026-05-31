// Use getElementById instead of document.currentScript because currentScript
// can be null for scripts loaded asynchronously (Next.js afterInteractive strategy).
const script = document.getElementById('fb-pixel')
const PIXEL_ID = script ? script.getAttribute('data-pixel-id') : null

function initializeFacebookPixel(f, b, e, v, n, t, s) {
  if (f.fbq) return
  n = f.fbq = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
  }
  if (!f._fbq) f._fbq = n
  n.push = n
  n.loaded = !0
  n.version = '2.0'
  n.queue = []
  t = b.createElement(e)
  t.async = !0
  t.src = v
  s = b.getElementsByTagName(e)[0]
  s.parentNode.insertBefore(t, s)
}

if (PIXEL_ID) {
  initializeFacebookPixel(
    window,
    document,
    'script',
    'https://connect.facebook.net/en_US/fbevents.js',
  )

  window.fbq('init', PIXEL_ID)
}
