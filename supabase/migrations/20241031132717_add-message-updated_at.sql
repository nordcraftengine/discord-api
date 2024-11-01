ALTER TABLE messages
    ADD COLUMN updated_at timestamptz;

DELETE FROM attachments;

DELETE FROM reactions;

DELETE FROM mentions;

DELETE FROM messages;

DELETE FROM topics;

DELETE FROM users;

