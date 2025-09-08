import type { HonoRequest } from 'hono'

export interface RefreshedResponse {
  refreshed_urls?: [{ original?: string; refreshed?: string }]
}

export interface CachedURL {
  href: string
  expires: Date
}

// There's a high chance that the instance will not be recycled between calls, especially under heavy load.
// We can extract previously saved results from the global cache object below.
export const cache = new Map<string, CachedURL>()

export const redirectResponse = ({
  href,
  expires,
  custom,
}: {
  request: HonoRequest
  href: string
  expires: Date
  custom: 'original' | 'refreshed' | 'memory'
}) => {
  // 302 Found https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302
  const response = new Response('', { status: 302 })
  response.headers.set('Location', href)
  response.headers.set(
    'Cache-Control',
    `public, max-age=${expires.getSeconds()}`,
  )

  response.headers.set('Expires', expires.toUTCString())
  response.headers.set('x-discord-cdn-proxy', custom)
  return response
}
