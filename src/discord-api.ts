import { ThreadsResponse, Thread, Message } from './types';

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
		await delay(1000);
	}
};


