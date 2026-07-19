CREATE TABLE IF NOT EXISTS quote_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'collecting_info',
    -- collecting_info | pending_owner | quoted | won | lost
  event_type TEXT,          -- 'matrimonio' | 'festa_privata' | 'evento_pubblico'
  event_date TEXT,          -- ISO date when determinable
  event_date_raw TEXT,      -- customer's own words for ambiguous dates
  location TEXT,
  guest_count INTEGER,
  services TEXT,            -- JSON array of service ids
  duration_hours REAL,
  special_requests TEXT,
  price_eur REAL,           -- set by the owner
  owner_notes TEXT,         -- extra lines the owner wants in the quote
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_request_id INTEGER REFERENCES quote_requests(id),
  wa_message_id TEXT UNIQUE,        -- inbound dedup: Meta redelivers webhooks
  direction TEXT NOT NULL,          -- 'in' | 'out'
  sender TEXT NOT NULL,             -- 'customer' | 'bot' | 'owner'
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_qr_phone_status ON quote_requests(customer_phone, status);
CREATE INDEX IF NOT EXISTS idx_msg_request ON messages(quote_request_id);
