import { fetchAttachment, getNewData } from './discord-api'
import { saveData } from '../supabase/updateData'
import {
	cache,
	CachedURL,
	handleOPTIONS,
	parseValidURL,
	redirectResponse,
	RefreshedResponse,
	withCORS,
} from './helpers'

// const CHANNELS = ['1075718033781305414', '1202214812495659028']
// const DISCORD_CDN_PROXY_BUCKET = 'https://discord-cdn-proxy.it.r.appspot.com/'

export default {
	// The scheduled handler is invoked at the interval set in our wrangler.toml's
	// [[triggers]] configuration.
	async scheduled(event, env, ctx): Promise<void> {
		const {
			newTopics,
			existingTopics,
			newMessages,
			updatedMessages,
			deleteMessageIds,
			newUsers,
		} = await getNewData(env)

		await saveData({
			topics: newTopics,
			existingTopics,
			newMessages,
			updatedMessages,
			deleteMessageIds,
			users: newUsers,
			env,
		})
	},

	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		try {
			return fetchAttachment(request, env)
		} catch (ex: any) {
			console.error(`Exception`, ex)
			return withCORS(request, new Response(ex, { status: 500 }))
		}
	},
} satisfies ExportedHandler<Env>
