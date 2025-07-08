-- Drop all existing reactions to ensure the unique constraint can be applied
DELETE FROM reactions;

-- Add a unique constraint on message_id and emoji on the existing reactions table
ALTER TABLE reactions
  ADD CONSTRAINT unique_message_emoji UNIQUE (message_id, emoji);

