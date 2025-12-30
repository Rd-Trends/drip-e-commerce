import { getCachedGlobal } from '@/lib/get-global.'
import { TopBannerClient } from './top-banner-client'

// Simple hash function to create a unique ID for banner content
function hashBannerContent(text: string, link?: { url?: string; label?: string }): string {
  const content = `${text}-${link?.url || ''}-${link?.label || ''}`
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

export async function TopBanner() {
  const banner = await getCachedGlobal('banner', 0)()

  // If banner is not enabled or doesn't have text, don't render anything
  if (!banner?.isEnabled || !banner?.text) {
    return null
  }

  // Create a hash of the banner content to track changes
  const bannerHash = hashBannerContent(banner.text, banner.link)

  return (
    <TopBannerClient
      text={banner.text}
      variant={(banner.variant as 'info' | 'success' | 'warning' | 'promo') || 'info'}
      isDismissible={banner.isDismissible || false}
      link={
        banner.link
          ? {
              label: banner.link.label,
              url: banner.link.url,
              newTab: banner.link.newTab ?? undefined,
            }
          : null
      }
      showLink={banner.showLink || false}
      bannerHash={bannerHash}
    />
  )
}
