import { getSupabaseClient } from '../supabase/client'
import {
	APIMessage,
	APIUser,
	RESTGetAPIChannelUsersThreadsArchivedResult,
	APIThreadChannel,
} from 'discord-api-types/v10'

const TODDLE_SERVER_ID = '972416966683926538'
export const HELP_CHANNEL_ID = '1075718033781305414'
const DISCORD_URL = 'https://discord.com/api/v10'

export const getAllTopics = async (env: Env, channelId?: string) => {
	const threadsUrl = `${DISCORD_URL}/guilds/${TODDLE_SERVER_ID}/threads/active`

	const response = await fetchData(threadsUrl, env.DISCORD_TOKEN)

	const threadsData =
		(await response.json()) as RESTGetAPIChannelUsersThreadsArchivedResult

	const threads = threadsData.threads as APIThreadChannel[]

	return channelId ? threads.filter((t) => t.parent_id === channelId) : threads
}

export const getMessages = async (
	threads: { id: string; after?: string }[],
	env: Env
) => {
	const messages = (
		await Promise.all(
			threads.map(async (thread) => {
				const messagesUrl = thread.after
					? `${DISCORD_URL}/channels/${thread.id}/messages?after=${thread.after}&limit=100`
					: `${DISCORD_URL}/channels/${thread.id}/messages?limit=100`

				const messageResponse = await fetchData(messagesUrl, env.DISCORD_TOKEN)

				const messages = (await messageResponse.json()) as APIMessage[]
				return messages
			})
		)
	).flat()

	return messages
}

export const getNewData = async (env: Env) => {
	const supabase = getSupabaseClient(env)

	const allTopics = await getAllTopics(env, HELP_CHANNEL_ID)
	const savedTopics = (await supabase.from('topics').select('*')).data ?? []
	const savedTopicIds = new Set(savedTopics?.map((t) => t.id))

	// Get the new topics
	const newTopics = allTopics.filter((thread) => !savedTopicIds.has(thread.id))

	const existingTopics: APIThreadChannel[] = []

	//Get the topics with new messages
	const newMessagesTopics = allTopics
		.map((thread) => {
			const lastSavedMessage = savedTopics?.find(
				(t) => t.id === thread.id
			)?.last_message_id

			if (thread.last_message_id !== lastSavedMessage) {
				// We need to update the last_message_id for this topic
				existingTopics.push(thread)
				return { id: thread.id, after: lastSavedMessage }
			}
		})
		.filter((m) => m !== undefined)

	// Get messages on a topic
	// We can't make more then 50 requests per second to Discord API. So we will wait 1 second after each 40 requests
	const newMessages: APIMessage[] = []
	const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

	for (let i = 0; i < newMessagesTopics.length; i += 40) {
		const threads = newMessagesTopics.slice(i, i + 40)
		newMessages.push(...(await getMessages(threads, env)))
		await delay(1000)
	}

	const newUsers: APIUser[] = []

	const savedUserIds =
		new Set(
			(await supabase.from('users').select('id')).data?.map((user) => user.id)
		) ?? []

	newMessages.forEach((message) => {
		if (
			!savedUserIds.has(message.author.id) &&
			!newUsers.find((user) => user.id === message.author.id)
		) {
			newUsers.push(message.author)
		}

		const newMentionUsers = message.mentions.filter(
			(m) =>
				!savedUserIds.has(m.id) && !newUsers.find((user) => user.id === m.id)
		)

		if (newMentionUsers.length > 0) {
			newUsers.push(...newMentionUsers)
		}
	})

	return { newTopics, existingTopics, newMessages, newUsers }
}

const fetchData = async (url: string, token: string) =>
	await fetch(url, {
		method: 'GET',
		headers: {
			Authorization: `Bot ${token}`,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
	})
