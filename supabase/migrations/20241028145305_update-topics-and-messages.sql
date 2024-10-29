ALTER TABLE messages
    ADD CONSTRAINT "message_reference_message_fkey" FOREIGN KEY (message_reference) REFERENCES messages(id) ON DELETE SET NULL;

