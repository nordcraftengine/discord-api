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

export const parseValidURL = (str: string): URL | false => {
	try {
		return new URL(str)
	} catch (_) {
		return false
	}
}

export const handleOPTIONS = (request: Request) => {
	// Adjust as desired: GET, POST, PATCH, DELETE, HEAD, OPTIONS
	const methods = 'GET, OPTIONS'
	if (
		request.headers.get('Origin') !== null &&
		request.headers.get('Access-Control-Request-Method') !== null &&
		request.headers.get('Access-Control-Request-Headers') !== null
	) {
		// Handle CORS pre-flight request.
		return new Response(null, {
			headers: {
				'Access-Control-Allow-Origin': request.headers.get('Origin') ?? '',
				'Access-Control-Allow-Methods': methods,
				'Access-Control-Allow-Headers':
					request.headers.get('Access-Control-Request-Headers') ?? '',
				'Access-Control-Max-Age': '86400',
			},
		})
	} else {
		// Handle standard OPTIONS request.
		return new Response(null, {
			headers: {
				Allow: methods,
			},
		})
	}
}

export const withCORS = (request: Request, response: Response): Response => {
	if (request.headers.get('Origin'))
		response.headers.set(
			'Access-Control-Allow-Origin',
			request.headers.get('Origin') ?? ''
		)
	return response
}

export const redirectResponse = (
	request: Request,
	href: string,
	expires: Date,
	custom: 'original' | 'refreshed' | 'memory'
) => {
	// 302 Found https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/302
	const response = new Response('', { status: 302, statusText: 'Found' })
	response.headers.set('Location', href)
	response.headers.set('Expires', expires.toUTCString())
	response.headers.set('x-discord-cdn-proxy', custom)
	return withCORS(request, response)
}
