import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { AppConfig } from "../config.js";
import type { QuoteRequest } from "../db/repositories.js";
import { getAnthropicClient } from "./client.js";

export type OwnerCommand =
  | { action: "set_price"; requestId: number; priceEur: number }
  | { action: "add_note"; requestId: number; note: string }
  | { action: "approve"; requestId: number }
  | { action: "reject"; requestId: number; reason?: string }
  | { action: "mark_won"; requestId: number }
  | { action: "mark_lost"; requestId: number }
  | { action: "list" }
  | { action: "unknown" };

/** Parses "900", "€900", "900€", "900,50", "1.200" into a number of euros. */
export function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/€/g, "").trim();
  if (!/^[0-9.,\s]+$/.test(cleaned)) return null;
  // Italian format: '.' thousands separator, ',' decimal separator.
  const normalized = cleaned.replace(/[.\s]/g, "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Deterministic tier: recognizes the documented commands without AI. */
export function parseOwnerCommand(text: string): OwnerCommand | null {
  const trimmed = text.trim();

  if (/^lista$/i.test(trimmed)) return { action: "list" };

  // "<id> prezzo <importo>" (also "prezzo <id> <importo>")
  let m =
    trimmed.match(/^#?(\d+)\s+prezzo\s+(.+)$/i) ??
    trimmed.match(/^prezzo\s+#?(\d+)\s+(.+)$/i);
  if (m) {
    const amount = parseAmount(m[2]!);
    if (amount === null) return null;
    return { action: "set_price", requestId: Number(m[1]), priceEur: amount };
  }

  // "<id> nota <testo>"
  m = trimmed.match(/^#?(\d+)\s+nota\s+(.+)$/is);
  if (m) return { action: "add_note", requestId: Number(m[1]), note: m[2]!.trim() };

  // "<id> ok" / "ok <id>"
  m = trimmed.match(/^#?(\d+)\s+ok$/i) ?? trimmed.match(/^ok\s+#?(\d+)$/i);
  if (m) return { action: "approve", requestId: Number(m[1]) };

  // "<id> rifiuta <motivo?>"
  m = trimmed.match(/^#?(\d+)\s+rifiuta\s*(.*)$/is);
  if (m) {
    const reason = m[2]?.trim();
    return {
      action: "reject",
      requestId: Number(m[1]),
      ...(reason ? { reason } : {}),
    };
  }

  // "<id> vinto" / "<id> perso"
  m = trimmed.match(/^#?(\d+)\s+vinto$/i);
  if (m) return { action: "mark_won", requestId: Number(m[1]) };
  m = trimmed.match(/^#?(\d+)\s+perso$/i);
  if (m) return { action: "mark_lost", requestId: Number(m[1]) };

  return null;
}

const aiCommandSchema = z.object({
  action: z.enum([
    "set_price",
    "add_note",
    "approve",
    "reject",
    "mark_won",
    "mark_lost",
    "list",
    "unknown",
  ]),
  request_id: z
    .number()
    .nullable()
    .describe("ID della richiesta a cui si riferisce il titolare, se identificabile"),
  price_eur: z.number().nullable(),
  note: z.string().nullable(),
  reason: z.string().nullable(),
});

/**
 * AI fallback for free-form owner replies like
 * "per il matrimonio di Giulia direi 900 euro, ok manda pure".
 */
export async function parseOwnerCommandWithAI(
  text: string,
  openRequests: QuoteRequest[],
  config: AppConfig,
): Promise<OwnerCommand> {
  const client = getAnthropicClient();
  const requestsContext = openRequests
    .map(
      (r) =>
        `#${r.id} [${r.status}] ${r.event_type ?? "evento"} di ${r.customer_name ?? "cliente"} — ${r.event_date ?? r.event_date_raw ?? "data n/d"} a ${r.location ?? "luogo n/d"}${r.price_eur != null ? ` (prezzo impostato: ${r.price_eur}€)` : ""}`,
    )
    .join("\n");

  const response = await client.beta.messages.parse({
    model: config.anthropicModel,
    max_tokens: 1024,
    system:
      "Interpreti i messaggi del titolare di un'azienda di intrattenimento musicale che gestisce richieste di preventivo. " +
      "Traduci il messaggio in un comando strutturato. Azioni possibili: " +
      "set_price (imposta un prezzo), add_note (aggiunge una nota al preventivo), approve (approva e invia il preventivo), " +
      "reject (declina la richiesta), mark_won (cliente ha confermato), mark_lost (cliente ha rifiutato), list (elenca richieste aperte), unknown. " +
      "Se il titolare indica un prezzo E chiede di inviare nello stesso messaggio, scegli set_price: il sistema chiederà poi conferma. " +
      "Identifica request_id dal contesto delle richieste aperte; se ambiguo o non identificabile con certezza, usa null. " +
      "Se il messaggio non è un comando gestibile, usa action unknown.",
    messages: [
      {
        role: "user",
        content: `Richieste aperte:\n${requestsContext || "(nessuna)"}\n\nMessaggio del titolare:\n${text}`,
      },
    ],
    output_format: betaZodOutputFormat(aiCommandSchema),
  });

  const parsed = response.parsed_output;
  if (!parsed) return { action: "unknown" };

  switch (parsed.action) {
    case "list":
      return { action: "list" };
    case "set_price":
      if (parsed.request_id == null || parsed.price_eur == null)
        return { action: "unknown" };
      return {
        action: "set_price",
        requestId: parsed.request_id,
        priceEur: parsed.price_eur,
      };
    case "add_note":
      if (parsed.request_id == null || !parsed.note) return { action: "unknown" };
      return { action: "add_note", requestId: parsed.request_id, note: parsed.note };
    case "approve":
    case "reject":
    case "mark_won":
    case "mark_lost": {
      if (parsed.request_id == null) return { action: "unknown" };
      if (parsed.action === "reject") {
        return {
          action: "reject",
          requestId: parsed.request_id,
          ...(parsed.reason ? { reason: parsed.reason } : {}),
        };
      }
      return { action: parsed.action, requestId: parsed.request_id };
    }
    default:
      return { action: "unknown" };
  }
}
