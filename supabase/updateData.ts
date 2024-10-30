import { getSupabaseClient } from './client'
import { APIMessage, APIThreadChannel, APIUser } from 'discord-api-types/v10'
import { parse } from 'discord-markdown-parser'

export const saveData = async (
	topics: APIThreadChannel[],
	existingTopics: APIThreadChannel[],
	messages: APIMessage[],
	users: APIUser[],
	env: Env
) => {
	const supabase = getSupabaseClient(env)

	const formattedUsers = users.map((user) => ({
		id: user.id,
		name: user.global_name,
		username: user.username,
		avatar: user.avatar,
	}))

	const formattedTopics = topics.map((topic) => ({
		id: topic.id,
		name: topic.name,
		author_id: topic.owner_id,
		channel_id: topic.parent_id ?? '',
		last_message_id: topic.last_message_id ?? '',
		message_count: topic.message_count ?? 0,
		created_at: topic.thread_metadata?.create_timestamp ?? '',
	}))

	const firstMessageUpdate = topics.map((topic) => ({
		id: topic.id,
		first_message_id: topic.id,
	}))

	const lastMessageUpdate = existingTopics.map((topic) => ({
		id: topic.id,
		last_message_id: topic.last_message_id ?? '',
		message_count: topic.message_count ?? 0,
	}))

	const topicForUpdate = [...firstMessageUpdate, ...lastMessageUpdate]

	const formattedMessages = messages.map((message) => ({
		id: message.id,
		content: parse(message.content, 'normal'),
		author_id: message.author.id,
		topic_id: message.channel_id,
		message_reference: message.id,
		created_at: message.timestamp,
	}))

	const formattedMentions = messages.flatMap((message) =>
		message.mentions.map((mention) => ({
			message_id: message.id,
			user_id: mention.id,
		}))
	)

	const formattedReactions = messages
		.flatMap((message) =>
			message.reactions?.map((reaction) => ({
				message_id: message.id,
				emoji: reaction.emoji.name ?? '',
				count: reaction.count,
			}))
		)
		.filter((reaction) => reaction !== undefined)

	const formattedAttachments = messages
		.flatMap((message) =>
			message.attachments.map((attachment) => ({
				id: attachment.id,
				message_id: message.id,
				url: attachment.url,
				content_type: attachment.content_type,
			}))
		)
		.filter((attachment) => attachment !== undefined)

	// Save the users
	if (formattedUsers.length > 0) {
		const insertUsers = await supabase.from('users').insert(formattedUsers)

		if (insertUsers.error) {
			console.error(
				`There was an error when inserting the users ${insertUsers.error.message}`
			)
		}
	}

	// Save the topics
	if (formattedTopics.length > 0) {
		const insertTopics = await supabase.from('topics').insert(formattedTopics)

		if (insertTopics.error) {
			console.error(
				`There was an error when inserting the topics ${insertTopics.error.message}`
			)
		}
	}

	// Save the messages
	if (formattedMessages.length > 0) {
		const insertMessages = await supabase
			.from('messages')
			.insert(formattedMessages)

		if (insertMessages.error) {
			console.error(
				`There was an error when inserting the messages ${insertMessages.error.message}`
			)
		}
	}

	// Update the topics
	if (topicForUpdate.length > 0) {
		Promise.all(
			topicForUpdate.map(async (topic) => {
				const updateTopics = await supabase
					.from('topics')
					.update(topic)
					.eq('id', topic.id)

				if (updateTopics.error) {
					console.error(
						`There was an error when updating the topics ${updateTopics.error.message}`
					)
				}
			})
		)
	}

	// Save the mentions
	if (formattedMentions.length > 0) {
		const insertMentions = await supabase
			.from('mentions')
			.insert(formattedMentions)

		if (insertMentions.error) {
			console.error(
				`There was an error when inserting the mentions ${insertMentions.error.message}`
			)
		}
	}

	// Save the reactions
	if (formattedReactions.length > 0) {
		const insertReactions = await supabase
			.from('reactions')
			.insert(formattedReactions)

		if (insertReactions.error) {
			console.error(
				`There was an error when inserting the reactions ${insertReactions.error.message}`
			)
		}
	}

	// Save the reactions
	if (formattedAttachments.length > 0) {
		const insertAttachments = await supabase
			.from('attachments')
			.insert(formattedAttachments)

		if (insertAttachments.error) {
			console.error(
				`There was an error when inserting the attachments ${insertAttachments.error.message}`
			)
		}
	}
}
