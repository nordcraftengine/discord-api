import { getSupabaseClient } from '../supabase/client';
import { Threads, Messages, Users } from './types';

export const saveData = async (topics: Threads[], messages: Messages[], users: Users[]) => {
	const supabase = getSupabaseClient();

	const formatedUsers = users.map((user) => ({
		id: user.id,
		name: user.global_name,
		username: user.username,
		avatar: user.avatar,
	}));

	const formatedTopics = topics.map((topic) => ({
		id: topic.id,
		name: topic.name,
		author_id: topic.owner_id,
		channel_id: topic.parent_id,
		last_message_id: topic.last_message_id,
		message_count: topic.message_count,
		created_at: topic.thread_metadata.create_timestamp,
	}));

	const formatedMessages = messages.map((message) => ({
		id: message.id,
		content: message.content,
		author_id: message.author.id,
		topic_id: message.channel_id,
		message_reference: message.id,
		created_at: message.timestamp,
	}));

	const formatedMentions = messages.flatMap((message) =>
		message.mentions.map((mention) => ({
			message_id: message.id,
			user_id: mention.id,
		}))
	);

	const formatedReactions = messages
		.flatMap((message) =>
			message.reactions?.map((reaction) => ({
				message_id: message.id,
				emoji: reaction.emoji.name,
				count: reaction.count,
			}))
		)
		.filter((reaction) => reaction !== undefined);

	// Save the users
	if (formatedUsers.length > 0) {
		const insertUsers = await supabase.from('users').insert(formatedUsers);

		if (insertUsers.error) {
			console.error(`There was an error when inserting the users ${insertUsers.error.message}`);
		}
	}

	// Save the topics
	if (formatedTopics.length > 0) {
		const insertTopics = await supabase.from('topics').insert(formatedTopics);

		if (insertTopics.error) {
			console.error(`There was an error when inserting the topics ${insertTopics.error.message}`);
		}
	}

	// Save the messages
	if (formatedMessages.length > 0) {
		const insertMessages = await supabase.from('messages').insert(formatedMessages);

		if (insertMessages.error) {
			console.error(`There was an error when inserting the messages ${insertMessages.error.message}`);
		}
	}

	// Save the mentions
	if (formatedMentions.length > 0) {
		const insertMentions = await supabase.from('mentions').insert(formatedMentions);

		if (insertMentions.error) {
			console.error(`There was an error when inserting the mentions ${insertMentions.error.message}`);
		}
	}

	// Save the reactions
	if (formatedReactions.length > 0) {
		const insertReactions = await supabase.from('reactions').insert(formatedReactions);

		if (insertReactions.error) {
			console.error(`There was an error when inserting the reactions ${insertReactions.error.message}`);
		}
	}
};
