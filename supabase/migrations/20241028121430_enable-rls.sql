ALTER TABLE users ENABLE ROW LEVEL SECURITY;

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users are visible to everyone." ON users
    FOR SELECT TO anon
        USING (TRUE);

CREATE POLICY "Topics are visible to everyone." ON topics
    FOR SELECT TO anon
        USING (TRUE);

CREATE POLICY "Messages are visible to everyone." ON messages
    FOR SELECT TO anon
        USING (TRUE);

CREATE POLICY "Mentions are visible to everyone." ON mentions
    FOR SELECT TO anon
        USING (TRUE);

CREATE POLICY "Reactions are visible to everyone." ON reactions
    FOR SELECT TO anon
        USING (TRUE);

CREATE POLICY "Attachments are visible to everyone." ON attachments
    FOR SELECT TO anon
        USING (TRUE);

