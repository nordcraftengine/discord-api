import { createClient } from '@supabase/supabase-js';

export const getMessages = async (ctx: ExecutionContext, env: Env) => {
	const serverId = '972416966683926538';
	const helpChannelId = '1075718033781305414';
	const discordUrl = 'https://discord.com/api/v10';
	const threadsUrl = `${discordUrl}/guilds/${serverId}/threads/active`;
	const response = await fetch(threadsUrl, {
		method: 'GET',
		headers: {
			Authorization: `Bot ${env.DISCORD_TOKEN}`,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
	});
	const topics = (await response.json()) as ThreadsResponse;

	const helpThreads = topics.threads.filter((t) => t.parent_id === helpChannelId);

	// To get all the messages on a thread

	const threadMessages: Record<string, Message[]> = {};

	const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

	const getMessages = async (threads: Thread[]) => {
		Promise.all(
			threads.map(async (thread) => {
				const messagesUrl = `${discordUrl}/channels/${thread.id}/messages`;

				const messageResponse = await fetch(messagesUrl, {
					method: 'GET',
					headers: {
						Authorization: `Bot ${env.DISCORD_TOKEN}`,
						'Content-Type': 'application/json',
						Accept: 'application/json',
					},
				});
				const messages = (await messageResponse.json()) as Message[];
				threadMessages[thread.id] = messages;
			})
		);
	};

	// We can make only 50 requests per second to Discord API. So we will wait 1 second after each 40 requests

	for (let i = 0; i < helpThreads.length; i += 40) {
		getMessages(helpThreads.slice(i, i + 40));
		await delay(1000); //It will make 10 calls and wait 1 seconds
	}

	console.log('threadMessages', threadMessages);
};

interface ThreadsResponse {
	has_more: boolean;
	threads: Thread[];
}

interface Thread {
	id: string;
	type: number;
	last_message_id: string;
	flags: number;
	guild_id: string;
	name: string;
	parent_id: string;
	rate_limit_per_user: number;
	bitrate: number;
	user_limit: number;
	rtc_region: null;
	owner_id: string;
	thread_metadata: {
		archived: boolean;
		archive_timestamp: Date;
		auto_archive_duration: number;
		locked: boolean;
		create_timestamp: Date;
	};
	message_count: number;
	member_count: number;
	total_message_sent: number;
	applied_tags: string[];
}

interface Message {
	type: number;
	content: string;
	mentions: [];
	mention_roles: [];
	attachments: [];
	embeds: [];
	timestamp: Date;
	edited_timestamp: Date | null;
	flags: 0;
	components: [];
	id: string;
	channel_id: string;
	author: {
		id: string;
		username: string;
		avatar: string;
		discriminator: number;
		public_flags: number;
		flags: number;
		banner: string | null;
		accent_color: number | null;
		global_name: string;
	};
	pinned: boolean;
	mention_everyone: boolean;
	tts: boolean;
	position: boolean;
}
