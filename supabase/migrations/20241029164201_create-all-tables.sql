DROP TABLE IF EXISTS attachments;

DROP TABLE IF EXISTS reactions;

DROP TABLE IF EXISTS mentions;

DROP TABLE IF EXISTS messages;

DROP TABLE IF EXISTS topics;

CREATE TABLE users(
    id text PRIMARY KEY,
    name text,
    username text NOT NULL,
    avatar text
);

CREATE TABLE topics(
    id text PRIMARY KEY,
    name text NOT NULL,
    author_id text REFERENCES users(id) ON DELETE SET NULL,
    channel_id text NOT NULL,
    last_message_id text NOT NULL,
    message_count int NOT NULL,
    created_at timestamptz NOT NULL
);

CREATE TABLE messages(
    id text PRIMARY KEY,
    content jsonb NOT NULL,
    author_id text REFERENCES users(id) ON DELETE SET NULL,
    topic_id text NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    message_reference text REFERENCES messages(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL
);

CREATE TABLE mentions(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id text NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT message_id_user_id UNIQUE (message_id, user_id)
);

CREATE TABLE reactions(
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id text NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    emoji text NOT NULL,
    count int NOT NULL
);

CREATE TABLE attachments(
    id text PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id text NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    url text NOT NULL,
    content_type text
);

CREATE INDEX topics_author_id ON topics(author_id);

CREATE INDEX messages_author_id ON messages(author_id);

CREATE INDEX messages_topic_id ON messages(topic_id);

CREATE INDEX messages_message_reference ON messages(message_reference);

CREATE INDEX mentions_message_id ON mentions(message_id);

CREATE INDEX mentions_user_id ON mentions(user_id);

CREATE INDEX reactions_message_id ON reactions(message_id);

CREATE INDEX attachments_message_id ON attachments(message_id);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users are visible to everyone." ON users
    FOR SELECT TO anon
        USING (TRUE);

CREATE POLICY "Topics are visible to everyone." ON topics
    FOR SELECT TO anon
        USING (TRUE);

CREATE POLICY "Messages are visible to everyone." ON messages
    FOR SELECT TO anon
        USING (TRUE);

CREATE POLICY "Mentions are visible to everyone." ON mentions
    FOR SELECT TO anon
        USING (TRUE);

CREATE POLICY "Reactions are visible to everyone." ON reactions
    FOR SELECT TO anon
        USING (TRUE);

CREATE POLICY "Attachments are visible to everyone." ON attachments
    FOR SELECT TO anon
        USING (TRUE);

