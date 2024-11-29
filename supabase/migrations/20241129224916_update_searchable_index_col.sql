UPDATE
    topics
SET
    searchable_index_col = to_tsvector('english', name)
WHERE
    first_message_id IS NULL;

