import { HonoRequest } from 'hono'

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

export const withCORS = (
	request: HonoRequest,
	response: Response
): Response => {
	if (request.header('Origin'))
		response.headers.set(
			'Access-Control-Allow-Origin',
			request.header('Origin') ?? ''
		)
	return response
}

export const redirectResponse = (
	request: HonoRequest,
	href: string,
	expires: Date,
	custom: 'original' | 'refreshed' | 'memory'
) => {
	// 302 Found https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302
	const response = new Response('', { status: 302 })
	response.headers.set('Location', href)
	response.headers.set('Expires', expires.toUTCString())
	response.headers.set('x-discord-cdn-proxy', custom)
	return withCORS(request, response)
}
