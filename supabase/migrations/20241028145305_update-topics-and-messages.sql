ALTER TABLE topics
    ADD COLUMN topic_message_id text;

ALTER TABLE messages
    ADD CONSTRAINT "message_reference_message_fkey" FOREIGN KEY (message_reference) REFERENCES messages(id) ON DELETE SET NULL;

UPDATE
    topics
SET
    topic_message_id = id;

ALTER TABLE topics
    ALTER COLUMN topic_message_id SET NOT NULL;

