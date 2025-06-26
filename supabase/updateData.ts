import { getSupabaseClient } from './client'
import type {
	APIMessage,
	APIPartialChannel,
	APIThreadChannel,
	APIUser,
} from 'discord-api-types/v10'
import { parse } from 'discord-markdown-parser'

export const saveData = async ({
	channels,
	topics,
	existingTopics,
	newMessages,
	updatedMessages,
	deleteMessageIds,
	users,
	newReactions,
	updatedReactions,
	deleteReactionIds,
	env,
}: {
	channels: APIPartialChannel[]
	topics: APIThreadChannel[]
	existingTopics: APIThreadChannel[]
	newMessages: APIMessage[]
	updatedMessages: APIMessage[]
	deleteMessageIds: string[]
	users: APIUser[]
	newReactions: {
		count: number
		emoji: string
		message_id: string
	}[]
	updatedReactions: {
		id: string
		count: number
	}[]
	deleteReactionIds: string[]
	env: Env
}) => {
	const supabase = getSupabaseClient(env)

	const channelsToCreate = channels.map((channel) => ({
		id: channel.id,
		name: channel.name ?? '',
	}))

	const usersToCreate = users.map((user) => ({
		id: user.id,
		name: user.global_name,
		username: user.username,
		avatar: user.avatar,
	}))

	const topicsToCreate: {
		id: string
		name: string
		author_id: string | undefined
		channel_id: string
		last_message_id: string
		message_count: number
		created_at: string
		updated_at?: string
		slug: string
	}[] = []

	const firstMessageUpdate: {
		id: string
		first_message_id: string | null
	}[] = []
	const savedTopics = (await supabase.from('topics').select('slug')).data ?? []
	const savedTopicsSlugs = new Set(savedTopics?.map((t) => t.slug))
	const newUserIds = new Set(usersToCreate?.map((user) => user.id))
	const savedUserIds = new Set(
		(await supabase.from('users').select('id')).data?.map((user) => user.id),
	)

	topics.forEach((topic) => {
		const reg = /[^A-Za-z0-9-]/g
		const multipleDashesReg = /-{2,}/g

		let slug = topic.name
			.replaceAll(' ', '-')
			.replaceAll(reg, '')
			.replaceAll(multipleDashesReg, '-')
		let i = 2

		let isNotUnique = true
		do {
			if (savedTopicsSlugs.has(slug)) {
				slug = `${slug}-${i}`
				i++
			} else {
				isNotUnique = false
			}
		} while (isNotUnique)

		const lastMessage = newMessages.find((m) => m.id === topic.last_message_id)

		const fTopic = {
			id: topic.id,
			name: topic.name,
			author_id:
				topic.owner_id &&
				(newUserIds.has(topic.owner_id) || savedUserIds.has(topic.owner_id))
					? topic.owner_id
					: undefined,
			channel_id: topic.parent_id ?? '',
			last_message_id: topic.last_message_id ?? '',
			message_count: topic.message_count ?? 0,
			created_at: topic.thread_metadata?.create_timestamp ?? '',
			updated_at: lastMessage?.edited_timestamp ?? lastMessage?.timestamp,
			slug,
		}
		topicsToCreate.push(fTopic)

		const messageUpdate = {
			id: topic.id,
			first_message_id: newMessages.find((m) => m.id === topic.id)
				? topic.id
				: null,
		}
		firstMessageUpdate.push(messageUpdate)
	})

	const lastMessageUpdate = existingTopics.map((topic) => ({
		id: topic.id,
		last_message_id: topic.last_message_id ?? '',
		message_count: topic.message_count ?? 0,
	}))

	const topicForUpdate = [...firstMessageUpdate, ...lastMessageUpdate]

	const messagesToCreate = newMessages.map((message) => ({
		id: message.id,
		content: parse(message.content, 'normal'),
		author_id: message.author.id,
		topic_id: message.channel_id,
		message_reference: message.referenced_message?.id,
		created_at: message.timestamp,
		updated_at: message.edited_timestamp,
	}))

	const messagesToUpdate = updatedMessages.map((message) => ({
		id: message.id,
		content: parse(message.content, 'normal'),
		updated_at: message.edited_timestamp,
	}))

	const allMessages = [...newMessages, ...updatedMessages]

	const mentionsToCreate: {
		message_id: string
		user_id: string
	}[] = []

	const attachmentsToCreate: {
		id: string
		message_id: string
		url: string
		content_type: string | undefined
		width?: number | null
		height?: number | null
		filename: string
	}[] = []

	allMessages.forEach((message) => {
		const mentions = message.mentions.map((mention) => ({
			message_id: message.id,
			user_id: mention.id,
		}))
		mentionsToCreate.push(...mentions)

		const attachments = message.attachments.map((attachment) => ({
			id: attachment.id,
			message_id: message.id,
			url: new URL(attachment.url).pathname,
			content_type: attachment.content_type,
			width: attachment.width,
			height: attachment.height,
			filename: attachment.filename,
		}))

		attachmentsToCreate.push(...attachments)
	})

	// Add the channels
	if (channels.length > 0) {
		const insertChannels = await supabase
			.from('channels')
			.insert(channelsToCreate)

		if (insertChannels.error) {
			console.error(
				`There was an error when inserting the channels ${insertChannels.error.message}`,
			)
		}
	}

	// Save the users
	if (usersToCreate.length > 0) {
		const insertUsers = await supabase.from('users').insert(usersToCreate)

		if (insertUsers.error) {
			console.error(
				`There was an error when inserting the users ${insertUsers.error.message}`,
			)
		}
	}

	// Save the topics
	if (topicsToCreate.length > 0) {
		const insertTopics = await supabase.from('topics').insert(topicsToCreate)
		if (insertTopics.error) {
			console.error(
				`There was an error when inserting the topics ${insertTopics.error.message}`,
			)
		}
	}

	// Add messages
	if (messagesToCreate.length > 0) {
		const insertMessages = await supabase
			.from('messages')
			.insert(messagesToCreate)

		if (insertMessages.error) {
			console.error(
				`There was an error when inserting the messages ${insertMessages.error.message}`,
			)
		}
	}

	// Update messages
	if (messagesToUpdate.length > 0) {
		await Promise.all(
			messagesToUpdate.map(async (message) => {
				const updateMessage = await supabase
					.from('messages')
					.update(message)
					.eq('id', message.id)

				if (updateMessage.error) {
					console.error(
						`There was an error when updating the message ${updateMessage.error.message}`,
					)
				}

				// Since we are updating messages we want to delete all the mentions, reactions and attacments for them and recreate it after
				const deleteMentions = await supabase
					.from('mentions')
					.delete()
					.eq('message_id', message.id)

				if (deleteMentions.error) {
					console.error(
						`There was an error when deleting the mentions ${deleteMentions.error.message}`,
					)
				}

				const deleteReactions = await supabase
					.from('reactions')
					.delete()
					.eq('message_id', message.id)

				if (deleteReactions.error) {
					console.error(
						`There was an error when deleting the reactions ${deleteReactions.error.message}`,
					)
				}

				const deleteAttachments = await supabase
					.from('attachments')
					.delete()
					.eq('message_id', message.id)

				if (deleteAttachments.error) {
					console.error(
						`There was an error when deleting the atachments ${deleteAttachments.error.message}`,
					)
				}
			}),
		)
	}

	// Update the topics
	if (topicForUpdate.length > 0) {
		await Promise.all(
			topicForUpdate.map(async (topic) => {
				const updateTopic = await supabase
					.from('topics')
					.update(topic)
					.eq('id', topic.id)

				if (updateTopic.error) {
					console.error(
						`There was an error when updating the topics ${updateTopic.error.message}`,
					)
				}
			}),
		)
	}

	// Add mentions
	if (mentionsToCreate.length > 0) {
		const insertMentions = await supabase
			.from('mentions')
			.insert(mentionsToCreate)

		if (insertMentions.error) {
			console.error(
				`There was an error when inserting the mentions ${insertMentions.error.message}`,
			)
		}
	}

	// Add reactions
	if (newReactions.length > 0) {
		const insertReactions = await supabase
			.from('reactions')
			.insert(newReactions)

		if (insertReactions.error) {
			console.error(
				`There was an error when inserting the reactions ${insertReactions.error.message}`,
			)
		}
	}

	// Update reactions
	if (updatedReactions.length > 0) {
		await Promise.all(
			updatedReactions.map(async (reaction) => {
				const updateReaction = await supabase
					.from('reactions')
					.update(reaction)
					.eq('id', reaction.id)

				if (updateReaction.error) {
					console.error(
						`There was an error when updating the reactions ${updateReaction.error.message}`,
					)
				}
			}),
		)
	}

	// Delete reactions
	if (deleteReactionIds.length > 0) {
		const deleteReactions = await supabase
			.from('reactions')
			.delete()
			.in('id', deleteReactionIds)

		if (deleteReactions.error) {
			console.error(
				`There was an error when deleting the reactions ${deleteReactions.error.message}`,
			)
		}
	}

	// Add attachments
	if (attachmentsToCreate.length > 0) {
		const insertAttachments = await supabase
			.from('attachments')
			.insert(attachmentsToCreate)

		if (insertAttachments.error) {
			console.error(
				`There was an error when inserting the attachments ${insertAttachments.error.message}`,
			)
		}
	}

	// Delete messages
	if (deleteMessageIds.length > 0) {
		const deleteMessages = await supabase
			.from('messages')
			.delete()
			.in('id', deleteMessageIds)

		if (deleteMessages.error) {
			console.error(
				`There was an error when deleting the messages ${deleteMessages.error.message}`,
			)
		}
	}
}

// To be deleted after attachments width and height are updated

export const updateAttachments = async ({
	messagesWithAttachments,
	env,
}: {
	messagesWithAttachments: APIMessage[]
	env: Env
}) => {
	const supabase = getSupabaseClient(env)

	const attachmentsToUpdate: {
		id: string
		filename: string
	}[] = []

	messagesWithAttachments.forEach((message) => {
		const attachments = message.attachments.map((attachment) => ({
			id: attachment.id,
			filename: attachment.filename,
		}))

		attachmentsToUpdate.push(...attachments)
	})

	// Update attachments
	if (attachmentsToUpdate.length > 0) {
		await Promise.all(
			attachmentsToUpdate.map(async (attachment) => {
				const updateAttachment = await supabase
					.from('attachments')
					.update(attachment)
					.eq('id', attachment.id)

				if (updateAttachment.error) {
					console.error(
						`There was an error when updating the attachments ${updateAttachment.error.message}`,
					)
				}
			}),
		)
	}
}
