/**
 * Welcome to Cloudflare Workers!
 *
 * This is a template for a Scheduled Worker: a Worker that can run on a
 * configurable interval:
 * https://developers.cloudflare.com/workers/platform/triggers/cron-triggers/
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { getNewData } from './discord-api'
import { saveData } from '../supabase/updateData'

export default {
	// The scheduled handler is invoked at the interval set in our wrangler.toml's
	// [[triggers]] configuration.
	async scheduled(event, env, ctx): Promise<void> {
		const { newTopics, newMessages, newUsers } = await getNewData(env)

		const t = await saveData(newTopics, newMessages, newUsers, env)
	},
} satisfies ExportedHandler<Env>
