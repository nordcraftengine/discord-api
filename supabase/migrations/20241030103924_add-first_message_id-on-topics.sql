ALTER TABLE topics
    ADD COLUMN first_message_id text REFERENCES messages(id) ON DELETE SET NULL;

UPDATE
    topics
SET
    first_message_id = id;

