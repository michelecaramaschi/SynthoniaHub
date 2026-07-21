import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { AppConfig } from "../config.js";
import type { QuoteRequest } from "../db/repositories.js";
import type { OwnerCommand } from "../core/owner-commands.js";
import { getAnthropicClient } from "./client.js";

const aiCommandSchema = z.object({
  action: z.enum([
    "set_price",
    "add_note",
    "mark_sent",
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
 * Only used when ANTHROPIC_API_KEY is set. Returns null when unrecognized.
 */
export async function parseOwnerCommandWithAI(
  text: string,
  openRequests: QuoteRequest[],
  config: AppConfig,
): Promise<OwnerCommand | null> {
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
      "Il titolare invia i preventivi al cliente DA SOLO su WhatsApp (il sistema non invia messaggi al cliente): " +
      "prepara solo testo e PDF pronti da copiare/allegare. " +
      "Traduci il messaggio in un comando strutturato. Azioni possibili: " +
      "set_price (imposta un prezzo e genera testo+PDF), add_note (aggiunge una nota al preventivo), " +
      "mark_sent (il titolare conferma di aver già inviato il preventivo al cliente lui stesso), " +
      "reject (declina la richiesta), mark_won (cliente ha confermato), mark_lost (cliente ha rifiutato), list (elenca richieste aperte), unknown. " +
      "Se il titolare indica un prezzo E dice di aver già mandato il preventivo nello stesso messaggio, scegli set_price: il sistema chiederà poi conferma dell'invio. " +
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
  if (!parsed) return null;

  switch (parsed.action) {
    case "list":
      return { action: "list" };
    case "set_price":
      if (parsed.request_id == null || parsed.price_eur == null) return null;
      return {
        action: "set_price",
        requestId: parsed.request_id,
        priceEur: parsed.price_eur,
      };
    case "add_note":
      if (parsed.request_id == null || !parsed.note) return null;
      return { action: "add_note", requestId: parsed.request_id, note: parsed.note };
    case "mark_sent":
    case "reject":
    case "mark_won":
    case "mark_lost": {
      if (parsed.request_id == null) return null;
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
      return null;
  }
}
