export interface ThreadsResponse {
	has_more: boolean;
	threads: Threads[];
}

export interface Threads {
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
		archive_timestamp: string;
		auto_archive_duration: number;
		locked: boolean;
		create_timestamp: string;
	};
	message_count: number;
	member_count: number;
	total_message_sent: number;
	applied_tags: string[];
}

export interface Messages {
	type: number;
	content: string;
	mentions: Users[];
	timestamp: string;
	edited_timestamp: string | null;
	flags: 0;
	id: string;
	channel_id: string;
	author: Users;
	pinned: boolean;
	mention_everyone: boolean;
	tts: boolean;
	position: boolean;
	reactions?:
		| {
				emoji: {
					name: string;
				};
				count: number;
		  }[]
		| null;
}

export interface Users {
	id: string;
	username: string;
	avatar: string | null;
	discriminator: number;
	public_flags: number;
	flags: number;
	banner: string | null;
	accent_color: number | null;
	global_name: string | null;
}
