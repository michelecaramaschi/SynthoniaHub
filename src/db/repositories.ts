import type Database from "better-sqlite3";
import {
  assertTransition,
  OPEN_STATUSES,
  type QuoteStatus,
} from "../core/state-machine.js";

export interface QuoteRequest {
  id: number;
  customer_phone: string;
  customer_name: string | null;
  status: QuoteStatus;
  event_type: string | null;
  event_date: string | null;
  event_date_raw: string | null;
  location: string | null;
  guest_count: number | null;
  services: string[] | null;
  duration_hours: number | null;
  special_requests: string | null;
  price_eur: number | null;
  owner_notes: string | null;
  awaiting_field: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteRequestPatch {
  customer_name?: string;
  event_type?: string;
  event_date?: string;
  event_date_raw?: string;
  location?: string;
  guest_count?: number;
  services?: string[];
  duration_hours?: number;
  special_requests?: string;
  price_eur?: number;
  owner_notes?: string;
  awaiting_field?: string | null;
}

export interface StoredMessage {
  id: number;
  quote_request_id: number | null;
  wa_message_id: string | null;
  direction: "in" | "out";
  sender: "customer" | "bot" | "owner";
  body: string;
  created_at: string;
}

type QuoteRow = Omit<QuoteRequest, "services"> & { services: string | null };

function rowToRequest(row: QuoteRow): QuoteRequest {
  return {
    ...row,
    services: row.services ? (JSON.parse(row.services) as string[]) : null,
  };
}

export class QuoteRequestRepository {
  constructor(private db: Database.Database) {}

  getById(id: number): QuoteRequest | null {
    const row = this.db
      .prepare("SELECT * FROM quote_requests WHERE id = ?")
      .get(id) as QuoteRow | undefined;
    return row ? rowToRequest(row) : null;
  }

  /** Newest open request for this phone, or a fresh `collecting_info` one. */
  findOrCreateActive(customerPhone: string): QuoteRequest {
    const placeholders = OPEN_STATUSES.map(() => "?").join(",");
    const row = this.db
      .prepare(
        `SELECT * FROM quote_requests
         WHERE customer_phone = ? AND status IN (${placeholders})
         ORDER BY id DESC LIMIT 1`,
      )
      .get(customerPhone, ...OPEN_STATUSES) as QuoteRow | undefined;
    if (row) return rowToRequest(row);

    const result = this.db
      .prepare("INSERT INTO quote_requests (customer_phone) VALUES (?)")
      .run(customerPhone);
    return this.getById(Number(result.lastInsertRowid))!;
  }

  patch(id: number, patch: QuoteRequestPatch): QuoteRequest {
    const sets: string[] = [];
    const values: unknown[] = [];
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      sets.push(`${key} = ?`);
      values.push(key === "services" ? JSON.stringify(value) : value);
    }
    if (sets.length > 0) {
      sets.push("updated_at = datetime('now')");
      this.db
        .prepare(`UPDATE quote_requests SET ${sets.join(", ")} WHERE id = ?`)
        .run(...values, id);
    }
    return this.getById(id)!;
  }

  /** Appends a note line (keeps previous owner notes). */
  appendOwnerNote(id: number, note: string): QuoteRequest {
    const current = this.getById(id);
    const combined = current?.owner_notes
      ? `${current.owner_notes}\n${note}`
      : note;
    return this.patch(id, { owner_notes: combined });
  }

  transition(id: number, to: QuoteStatus): QuoteRequest {
    const current = this.getById(id);
    if (!current) throw new Error(`Quote request #${id} not found`);
    assertTransition(current.status, to);
    this.db
      .prepare(
        "UPDATE quote_requests SET status = ?, updated_at = datetime('now') WHERE id = ?",
      )
      .run(to, id);
    return this.getById(id)!;
  }

  listByStatus(statuses: QuoteStatus[]): QuoteRequest[] {
    const placeholders = statuses.map(() => "?").join(",");
    const rows = this.db
      .prepare(
        `SELECT * FROM quote_requests WHERE status IN (${placeholders}) ORDER BY id ASC`,
      )
      .all(...statuses) as QuoteRow[];
    return rows.map(rowToRequest);
  }
}

export class MessageRepository {
  constructor(private db: Database.Database) {}

  /** Returns false when the WhatsApp message id was already stored (webhook retry). */
  recordInbound(params: {
    quoteRequestId: number | null;
    waMessageId: string | null;
    sender: "customer" | "owner";
    body: string;
  }): boolean {
    if (params.waMessageId) {
      const existing = this.db
        .prepare("SELECT id FROM messages WHERE wa_message_id = ?")
        .get(params.waMessageId);
      if (existing) return false;
    }
    this.db
      .prepare(
        "INSERT INTO messages (quote_request_id, wa_message_id, direction, sender, body) VALUES (?, ?, 'in', ?, ?)",
      )
      .run(params.quoteRequestId, params.waMessageId, params.sender, params.body);
    return true;
  }

  recordOutbound(quoteRequestId: number | null, body: string): void {
    this.db
      .prepare(
        "INSERT INTO messages (quote_request_id, direction, sender, body) VALUES (?, 'out', 'bot', ?)",
      )
      .run(quoteRequestId, body);
  }

  /** Customer-facing conversation history for one request, oldest first. */
  historyForRequest(quoteRequestId: number, limit = 30): StoredMessage[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM (
           SELECT * FROM messages
           WHERE quote_request_id = ? AND sender IN ('customer', 'bot')
           ORDER BY id DESC LIMIT ?
         ) ORDER BY id ASC`,
      )
      .all(quoteRequestId, limit) as StoredMessage[];
    return rows;
  }
}
