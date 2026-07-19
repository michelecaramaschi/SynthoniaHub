-- Interview cursor for the guided conversation flow:
-- which question the bot is currently waiting an answer for.
-- Values: a field name (event_type, event_date, ...), 'special_requests', 'done', or NULL.
ALTER TABLE quote_requests ADD COLUMN awaiting_field TEXT;
