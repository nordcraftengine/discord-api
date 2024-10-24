import { ThreadsResponse, Messages, Users } from './types'
import { getSupabaseClient } from '../supabase/client'

const TODDLE_SERVER_ID = '972416966683926538'
export const HELP_CHANNEL_ID = '1075718033781305414'
const DISCORD_URL = 'https://discord.com/api/v10'

export const getAllTopics = async (env: Env, channelId?: string) => {
	const threadsUrl = `${DISCORD_URL}/guilds/${TODDLE_SERVER_ID}/threads/active`
	const response = await fetch(threadsUrl, {
		method: 'GET',
		headers: {
			Authorization: `Bot ${env.DISCORD_TOKEN}`,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
	})
	const threadsData = (await response.json()) as ThreadsResponse

	return channelId
		? threadsData.threads.filter((t) => t.parent_id === channelId)
		: threadsData.threads
}

export const getMessages = async (
	threads: { id: string; after?: string }[],
	env: Env
) => {
	const messages = (
		await Promise.all(
			threads.map(async (thread) => {
				const messagesUrl = thread.after
					? `${DISCORD_URL}/channels/${thread.id}/messages?after=${thread.after}`
					: `${DISCORD_URL}/channels/${thread.id}/messages`

				const messageResponse = await fetch(messagesUrl, {
					method: 'GET',
					headers: {
						Authorization: `Bot ${env.DISCORD_TOKEN}`,
						'Content-Type': 'application/json',
						Accept: 'application/json',
					},
				})
				const messages = (await messageResponse.json()) as Messages[]
				return messages
			})
		)
	).flat()

	return messages
}

export const getNewData = async (env: Env) => {
	const supabase = getSupabaseClient()

	const allTopics = await getAllTopics(env, HELP_CHANNEL_ID)
	const savedTopics = (await supabase.from('topics').select('*')).data ?? []
	const savedTopicIds = savedTopics?.map((t) => t.id)

	// Get the new topics
	const newTopics = allTopics.filter(
		(thread) => !savedTopicIds.includes(thread.id)
	)

	//Get the topics with new messages
	const newMessagesTopics = allTopics
		.map((thread) => {
			const lastSavedMessage = savedTopics?.find(
				(t) => t.id === thread.id
			)?.last_message_id

			if (thread.last_message_id !== lastSavedMessage) {
				return { id: thread.id, after: lastSavedMessage }
			}
		})
		.filter((m) => m !== undefined)

	// Get messages on a topic
	// We can't make more then 50 requests per second to Discord API. So we will wait 1 second after each 40 requests
	const newMessages: Messages[] = []
	const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

	for (let i = 0; i < newMessagesTopics.length; i += 40) {
		const threads = newMessagesTopics.slice(i, i + 40)
		newMessages.push(...(await getMessages(threads, env)))
		await delay(1000)
	}

	const newUsers: Users[] = []

	const savedUserIds =
		(await supabase.from('users').select('id')).data?.map((user) => user.id) ??
		[]

	newMessages.forEach((message) => {
		if (
			!savedUserIds.includes(message.author.id) &&
			!newUsers.find((user) => user.id === message.author.id)
		) {
			newUsers.push(message.author)
		}

		const newMentionUsers = message.mentions.filter(
			(m) =>
				!savedUserIds.includes(m.id) &&
				!newUsers.find((user) => user.id === m.id)
		)

		if (newMentionUsers.length > 0) {
			newUsers.push(...newMentionUsers)
		}
	})

	return { newTopics, newMessages, newUsers }
}
