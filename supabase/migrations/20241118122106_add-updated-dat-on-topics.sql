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
    ADD COLUMN height int,
    ADD CONSTRAINT width_nonnegative CHECK (width >= 0),
    ADD CONSTRAINT height_nonnegative CHECK (height >= 0);

UPDATE
    topics
SET
    slug = REGEXP_REPLACE((
        SELECT
            t2.slug
        FROM topics t2
        WHERE
            topics.id = t2.id), '-{2,}', '-', 'g');

