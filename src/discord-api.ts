import { getSupabaseClient } from '../supabase/client'
import {
	APIMessage,
	APIUser,
	RESTGetAPIChannelUsersThreadsArchivedResult,
	APIThreadChannel,
} from 'discord-api-types/v10'

import {
	cache,
	CachedURL,
	redirectResponse,
	RefreshedResponse,
	withCORS,
} from './helpers'
import { Context } from 'hono'

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
	const deleteMessageIds: string[] = []

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

		const dMessages = savedMessages
			.filter((m) => !messages.find((sm) => sm.id === m.id))
			.map((m) => m.id)

		newMessages.push(...nMessages)
		updatedMessages.push(...uMessages)
		deleteMessageIds.push(...dMessages)

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

	return {
		newTopics,
		existingTopics,
		newMessages,
		updatedMessages,
		deleteMessageIds,
		newUsers,
	}
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

export const fetchAttachment = async (ctx: Context) => {
	const request = ctx.req
	const env = ctx.env

	const attachment_url = new URL(ctx.req.param('url'))

	console.log('attachment_url', attachment_url)

	const params = new URLSearchParams(attachment_url.search)
	if (params.get('ex') && params.get('is') && params.get('hm')) {
		const expires = new Date(parseInt(params.get('ex') ?? '', 16) * 1000)
		if (expires.getTime() > Date.now()) {
			return redirectResponse(request, attachment_url.href, expires, 'original')
		}
	}

	const file_name = attachment_url.pathname.split('/').pop() ?? ''

	// Check memory cache first
	const cached_url = cache.get(file_name)

	if (cached_url && cached_url.expires.getTime() > Date.now()) {
		return redirectResponse(
			request,
			cached_url.href,
			cached_url.expires,
			'memory'
		)
	}

	const payload = {
		method: 'POST',
		headers: {
			Authorization: `Bot ${env.DISCORD_TOKEN}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ attachment_urls: [attachment_url.href] }),
	}

	const response = await fetch(
		`${DISCORD_URL}/attachments/refresh-urls`,
		payload
	)

	// If failed return original Discord API response back
	if (response.status != 200) return withCORS(request, response)

	const json = await response.json<RefreshedResponse>()

	if (Array.isArray(json?.refreshed_urls) && json.refreshed_urls[0].refreshed) {
		const refreshed_url = new URL(json.refreshed_urls[0].refreshed)
		const params = new URLSearchParams(refreshed_url.search)
		// Convert from hex and add seconds
		const expires = new Date(parseInt(params.get('ex') ?? '', 16) * 1000)

		const cached_url: CachedURL = { href: refreshed_url.href, expires }

		// Save to memory cache
		cache.set(file_name, cached_url)

		return redirectResponse(request, refreshed_url.href, expires, 'refreshed')
	}

	// Return Discord API json which does not have expected data
	return withCORS(request, Response.json(json, { status: 400 }))
}
