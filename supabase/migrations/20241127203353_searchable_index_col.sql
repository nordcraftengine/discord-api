ALTER TABLE topics
    ADD COLUMN searchable_index_col tsvector;

CREATE INDEX search_idx ON topics USING gin(searchable_index_col);

UPDATE
    topics t
SET
    searchable_index_col = to_tsvector('english', t.name || ' ' || m.content)
FROM
    messages m
WHERE
    t.first_message_id = m.id;

CREATE OR REPLACE FUNCTION private.update_searchable_index_col()
    RETURNS TRIGGER
    AS $$
DECLARE
    message_content text;
BEGIN
    SELECT
        m.content INTO message_content
    FROM
        public.messages m
    WHERE
        m.id = NEW.first_message_id;
    NEW.searchable_index_col = to_tsvector('english', NEW.name || ' ' || coalesce(message_content, ''));
    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER topics_update_vector
    BEFORE UPDATE OF first_message_id ON topics
    FOR EACH ROW
    EXECUTE FUNCTION private.update_searchable_index_col();

