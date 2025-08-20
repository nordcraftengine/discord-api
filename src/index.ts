import { fetchAttachment, getLfgTopics, getNewData } from './discord-api'
import { saveData, updateAttachments } from '../supabase/updateData'

import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('/api/*', cors())

app.get('/api/:url{.*}', fetchAttachment)

app.get('/api/lfg-topics', getLfgTopics)

export default {
	// The scheduled handler is invoked at the interval set in our wrangler.toml's
	// [[triggers]] configuration.
	async scheduled(_event, env): Promise<void> {
		const start = performance.now()
		const {
			allMessageIds,
			newChannels,
			newTopics,
			existingTopics,
			newMessages,
			updatedMessages,
			deleteMessageIds,
			newUsers,
			messagesWithAttachments,
			newReactions,
			updatedReactions,
			deleteReactionIds,
		} = await getNewData(env)
		console.log(`Fetched all relevant data in ${performance.now() - start}ms`)

		const saveStart = performance.now()
		await saveData({
			allMessageIds,
			channels: newChannels,
			topics: newTopics,
			existingTopics,
			newMessages,
			updatedMessages,
			deleteMessageIds,
			users: newUsers,
			newReactions,
			updatedReactions,
			deleteReactionIds,
			env,
		})
		console.log(`Saved all relevant data in ${performance.now() - saveStart}ms`)

		// To be deleted after attachments width and height are updated
		await updateAttachments({ messagesWithAttachments, env })
	},
	fetch: app.fetch,
} satisfies ExportedHandler<Env>
