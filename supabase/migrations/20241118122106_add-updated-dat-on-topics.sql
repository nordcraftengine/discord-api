ALTER TABLE topics
    ADD COLUMN updated_at timestamptz;

UPDATE
    topics
SET
    updated_at =(
        SELECT
            CASE WHEN updated_at IS NOT NULL THEN
                updated_at
            ELSE
                created_at
            END
        FROM
            messages
        WHERE
            topics.last_message_id = messages.id);

ALTER TABLE attachments
    ADD COLUMN width int,
    ADD COLUMN height int;

