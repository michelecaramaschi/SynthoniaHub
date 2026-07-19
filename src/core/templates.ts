import type { QuoteRequest } from "../db/repositories.js";
import type { BusinessProfile } from "../config.js";

const EVENT_TYPE_LABELS: Record<string, string> = {
  matrimonio: "Matrimonio",
  festa_privata: "Festa privata",
  evento_pubblico: "Evento pubblico",
};

export function eventTypeLabel(eventType: string | null): string {
  if (!eventType) return "Evento";
  return EVENT_TYPE_LABELS[eventType] ?? eventType;
}

export function serviceLabels(
  serviceIds: string[] | null,
  business: BusinessProfile,
): string {
  if (!serviceIds || serviceIds.length === 0) return "da definire";
  return serviceIds
    .map(
      (id) => business.services.find((s) => s.id === id)?.label ?? id,
    )
    .join(", ");
}

function formatDate(request: QuoteRequest): string {
  if (request.event_date && request.event_date_raw) {
    return `${request.event_date} (${request.event_date_raw})`;
  }
  return request.event_date ?? request.event_date_raw ?? "da definire";
}

/** Italian format ("1.200,50") without relying on the runtime's ICU data. */
export function formatPrice(price: number): string {
  const [integerPart, decimalPart] = price.toFixed(2).split(".") as [
    string,
    string,
  ];
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decimalPart === "00" ? grouped : `${grouped},${decimalPart}`;
}

/** Summary sent to the owner when info collection completes. */
export function ownerNotification(
  request: QuoteRequest,
  business: BusinessProfile,
  aiSummary?: string,
): string {
  const lines = [
    `🎧 NUOVA RICHIESTA DI PREVENTIVO #${request.id}`,
    "",
    `👤 Cliente: ${request.customer_name ?? "nome non fornito"} (+${request.customer_phone})`,
    `🎉 Evento: ${eventTypeLabel(request.event_type)}`,
    `📅 Data: ${formatDate(request)}`,
    `📍 Luogo: ${request.location ?? "da definire"}`,
    `👥 Ospiti: ${request.guest_count ?? "da definire"}`,
    `🎵 Servizi: ${serviceLabels(request.services, business)}`,
    `⏱ Durata: ${request.duration_hours != null ? `${request.duration_hours} ore` : "da definire"}`,
  ];
  if (request.special_requests) {
    lines.push(`📝 Note: ${request.special_requests}`);
  }
  if (aiSummary) {
    lines.push("", `💬 Riepilogo: ${aiSummary}`);
  }
  lines.push(
    "",
    "Per inviare il preventivo rispondi:",
    `  ${request.id} prezzo 900`,
    `  ${request.id} nota Include allestimento luci base   (opzionale)`,
    `  ${request.id} ok   → invia il preventivo al cliente`,
    `Altri comandi: ${request.id} rifiuta | lista`,
  );
  return lines.join("\n");
}

/** The quote message the customer receives (and the preview the owner approves). */
export function quoteMessage(
  request: QuoteRequest,
  business: BusinessProfile,
): string {
  if (request.price_eur == null) {
    throw new Error(`Quote request #${request.id} has no price set`);
  }
  const firstName = request.customer_name?.split(" ")[0];
  const lines = [
    firstName ? `Ciao ${firstName}! 🎶` : "Ciao! 🎶",
    "",
    "Grazie per averci contattato. Ecco il preventivo per il tuo evento:",
    "",
    `✨ ${eventTypeLabel(request.event_type)} — ${formatDate(request)}`,
    `📍 ${request.location ?? "località da definire"}`,
    `🎵 Servizi: ${serviceLabels(request.services, business)}`,
  ];
  if (request.duration_hours != null) {
    lines.push(`⏱ Durata: ${request.duration_hours} ore`);
  }
  if (request.owner_notes) {
    lines.push(`ℹ️ ${request.owner_notes.split("\n").join("\nℹ️ ")}`);
  }
  lines.push(
    "",
    `💶 Totale: ${formatPrice(request.price_eur)} €`,
    "",
    "Il preventivo è valido 30 giorni e comprende attrezzatura, allestimento e assistenza tecnica per tutta la durata dell'evento.",
    "",
    "Per confermare o per qualsiasi domanda rispondi pure a questo messaggio: siamo a tua disposizione!",
    "",
    `${business.name} — Musica ed eventi`,
  );
  return lines.join("\n");
}

/** Polite decline sent to the customer when the owner rejects a request. */
export function declineMessage(
  request: QuoteRequest,
  reason: string | undefined,
  business: BusinessProfile,
): string {
  const firstName = request.customer_name?.split(" ")[0];
  const lines = [
    firstName ? `Ciao ${firstName},` : "Ciao,",
    "",
    "grazie per averci contattato e per l'interesse nei nostri servizi.",
    reason
      ? `Purtroppo per questa data non riusciamo a garantirti il servizio: ${reason}.`
      : "Purtroppo per questa data non riusciamo a garantirti il servizio.",
    "",
    "Speriamo di poter collaborare in una prossima occasione!",
    "",
    `${business.name} — Musica ed eventi`,
  ];
  return lines.join("\n");
}

/** Fallback when the AI is unavailable. */
export const AI_UNAVAILABLE_MESSAGE =
  "Grazie per il tuo messaggio! 🎶 In questo momento non riusciamo a risponderti automaticamente, ma ti ricontattiamo al più presto.";

/** Reply for non-text messages (audio, images, ...). */
export const UNSUPPORTED_MEDIA_MESSAGE =
  "Al momento riesco a leggere solo messaggi di testo 🙏 Puoi scrivermi i dettagli del tuo evento?";

export function ownerHelp(): string {
  return [
    "Comandi disponibili:",
    "  <id> prezzo <importo>   → imposta il prezzo (es: 42 prezzo 900)",
    "  <id> nota <testo>       → aggiunge una nota al preventivo",
    "  <id> ok                 → invia il preventivo al cliente",
    "  <id> rifiuta <motivo?>  → declina la richiesta",
    "  <id> vinto | <id> perso → chiude una richiesta preventivata",
    "  lista                   → mostra le richieste aperte",
  ].join("\n");
}
