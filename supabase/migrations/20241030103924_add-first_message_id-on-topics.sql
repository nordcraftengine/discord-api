ALTER TABLE topics
    ADD COLUMN first_message_id text REFERENCES messages(id) ON DELETE SET NULL;

CREATE INDEX topics_first_message_id ON topics(first_message_id);

UPDATE
    topics
SET
    first_message_id = id;

