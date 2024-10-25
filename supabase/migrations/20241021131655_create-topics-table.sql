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
  content text NOT NULL,
  author_id text REFERENCES users(id) ON DELETE SET NULL,
  topic_id text NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  message_reference text,
  created_at timestamptz NOT NULL
);

CREATE TABLE mentions(
  message_id text NOT NULL  REFERENCES messages(id) ON DELETE CASCADE,
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

CREATE INDEX messages_topic_id on messages(topic_id);

