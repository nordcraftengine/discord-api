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

const getMessages = async (threads: { id: string }[], env: Env) => {
	const messages = (
		await Promise.all(
			threads.map(async (thread) => {
				let lastMessage = undefined
				let fetchMore = true
				do {
					const messagesUrl = lastMessage
						? `${DISCORD_URL}/channels/${thread.id}/messages?after=${lastMessage}&limit=100`
						: `${DISCORD_URL}/channels/${thread.id}/messages?limit=100`

					const messageResponse = await fetchData(
						messagesUrl,
						env.DISCORD_TOKEN
					)

					const messages = (await messageResponse.json()) as APIMessage[]
					lastMessage = messages.at(-1)?.id
					if (messages.length < 100) {
						fetchMore = false
					}
					return messages
				} while (fetchMore)
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

	const newMessages: APIMessage[] = []
	const updatedMessages: APIMessage[] = []

	const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

	// Get messages on a topic
	// We can't make more then 50 requests per second to Discord API. So we will wait 1 second after each 40 requests
	for (let i = 0; i < allTopics.length; i += 40) {
		const threads = allTopics.slice(i, i + 40)
		const threadIds = threads.map((t) => t.id)

		const savedMessages =
			(
				await supabase
					.from('messages')
					.select('id,updated_at')
					.in('topic_id', threadIds)
			).data ?? []

		const messages = await getMessages(threads, env)
		const nMessages = messages.filter(
			(m) => !savedMessages.find((sm) => sm.id === m.id)
		)
		const uMessages = messages.filter((m) => {
			const savedMsg = savedMessages.find((sm) => sm.id === m.id)

			if (savedMsg?.updated_at && m.edited_timestamp) {
				if (new Date(m.edited_timestamp) > new Date(savedMsg.updated_at)) {
					return m
				}
			}
		})

		newMessages.push(...nMessages)
		updatedMessages.push(...uMessages)

		await delay(1000)
	}

	const newUsers: APIUser[] = []

	const savedUserIds = new Set(
		(await supabase.from('users').select('id')).data?.map((user) => user.id)
	)
	const allMessages = [...newMessages, ...updatedMessages]

	allMessages.forEach((message) => {
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

	return { newTopics, existingTopics, newMessages, updatedMessages, newUsers }
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
