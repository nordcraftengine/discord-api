ALTER TABLE topics
    ADD COLUMN slug text;

UPDATE
    topics
SET
    slug = REGEXP_REPLACE(REPLACE((
            SELECT
                t2.name
            FROM topics t2
            WHERE
                topics.id = t2.id), ' ', '-'), '[^A-Za-z0-9-]', '', 'g');

ALTER TABLE topics
    ALTER COLUMN slug SET NOT NULL;

ALTER TABLE topics
    ADD CONSTRAINT slug_unique UNIQUE (slug);

