CREATE TABLE channels(
    id text PRIMARY KEY,
    name text NOT NULL
);

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Channels are visible to everyone." ON channels
    FOR SELECT TO anon
        USING (TRUE);

