import { fetchAttachment, getNewData } from './discord-api'
import { saveData } from '../supabase/updateData'

import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('/api/*', cors())

app.get('/api/:url{.*}', fetchAttachment)

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
	fetch: app.fetch,
} satisfies ExportedHandler<Env>
