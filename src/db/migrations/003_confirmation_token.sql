-- Customer-facing quote confirmation: the PDF carries a link with this token,
-- so clicking it identifies the request without exposing the sequential id.
ALTER TABLE quote_requests ADD COLUMN confirmation_token TEXT;
ALTER TABLE quote_requests ADD COLUMN confirmed_at TEXT;
ALTER TABLE quote_requests ADD COLUMN confirmed_name TEXT;
ALTER TABLE quote_requests ADD COLUMN confirmed_notes TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_confirmation_token
  ON quote_requests(confirmation_token);
