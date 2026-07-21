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

/** Resolved ISO date shown the Italian way (12/09/2026); falls back to the customer's wording. */
export function eventDateItalian(request: QuoteRequest): string {
  if (request.event_date) {
    const [year, month, day] = request.event_date.split("-");
    if (year && month && day) return `${day}/${month}/${year}`;
  }
  return request.event_date_raw ?? "da definire";
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
    `NUOVA RICHIESTA DI PREVENTIVO #${request.id}`,
    "",
    `Cliente: ${request.customer_name ?? "nome non fornito"} (+${request.customer_phone})`,
    `Evento: ${eventTypeLabel(request.event_type)}`,
    `Data: ${formatDate(request)}`,
    `Luogo: ${request.location ?? "da definire"}`,
    `Ospiti: ${request.guest_count ?? "da definire"}`,
    `Servizi: ${serviceLabels(request.services, business)}`,
    `Durata: ${request.duration_hours != null ? `${request.duration_hours} ore` : "da definire"}`,
  ];
  if (request.special_requests) {
    lines.push(`Note: ${request.special_requests}`);
  }
  if (aiSummary) {
    lines.push("", `Riepilogo: ${aiSummary}`);
  }
  lines.push(
    "",
    "Per preparare il preventivo rispondi:",
    `  ${request.id} prezzo 900   → genera testo e PDF pronti da inviare tu`,
    `  ${request.id} nota Include allestimento luci base   (opzionale)`,
    `  ${request.id} inviato   → segna la richiesta come inviata (dopo che l'hai mandata tu)`,
    `Altri comandi: ${request.id} rifiuta | lista`,
  );
  return lines.join("\n");
}

/** The quote message the customer receives (and the preview the owner approves). */
export function quoteMessage(
  request: QuoteRequest,
  business: BusinessProfile,
  confirmUrl?: string,
): string {
  if (request.price_eur == null) {
    throw new Error(`Quote request #${request.id} has no price set`);
  }
  const firstName = request.customer_name?.split(" ")[0];
  const lines = [
    firstName ? `Ciao ${firstName},` : "Ciao,",
    "",
    "grazie per averci contattato. Ecco il preventivo per il tuo evento:",
    "",
    `Evento: ${eventTypeLabel(request.event_type)} — ${formatDate(request)}`,
    `Luogo: ${request.location ?? "località da definire"}`,
    `Servizi: ${serviceLabels(request.services, business)}`,
  ];
  if (request.duration_hours != null) {
    lines.push(`Durata: ${request.duration_hours} ore`);
  }
  if (request.owner_notes) {
    lines.push("", request.owner_notes);
  }
  lines.push(
    "",
    `Totale: ${formatPrice(request.price_eur)} €`,
    "",
    "Il preventivo è valido 30 giorni e comprende attrezzatura, allestimento e assistenza tecnica per tutta la durata dell'evento.",
  );
  if (confirmUrl) {
    lines.push(
      "",
      "Per accettarlo ti basta un clic:",
      confirmUrl,
      "",
      "Per qualsiasi domanda rispondi pure a questo messaggio, siamo a tua disposizione.",
    );
  } else {
    lines.push(
      "",
      "Per confermare o per qualsiasi domanda rispondi pure a questo messaggio, siamo a tua disposizione.",
    );
  }
  lines.push("", `${business.name} — Musica ed eventi`);
  return lines.join("\n");
}

/** Alert sent to the owner the moment a customer accepts a quote from the PDF link. */
export function confirmationNotification(
  request: QuoteRequest,
  business: BusinessProfile,
): string {
  const lines = [
    `PREVENTIVO #${request.id} CONFERMATO ✅`,
    "",
    `Cliente: ${request.customer_name ?? "nome non fornito"} (+${request.customer_phone})`,
    `Evento: ${eventTypeLabel(request.event_type)}`,
    `Data: ${eventDateItalian(request)}`,
    `Luogo: ${request.location ?? "da definire"}`,
    `Servizi: ${serviceLabels(request.services, business)}`,
  ];
  if (request.price_eur != null) {
    lines.push(`Importo: ${formatPrice(request.price_eur)} €`);
  }
  if (request.confirmed_name) {
    lines.push(`Confermato da: ${request.confirmed_name}`);
  }
  if (request.confirmed_notes) {
    lines.push(`Note del cliente: ${request.confirmed_notes}`);
  }
  lines.push("", "La richiesta è stata segnata come vinta.");
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
    "Speriamo di poter collaborare in una prossima occasione.",
    "",
    `${business.name} — Musica ed eventi`,
  ];
  return lines.join("\n");
}

// ── Guided conversation (interview) ─────────────────────────────────────────

export type InterviewField =
  | "event_type"
  | "event_date"
  | "location"
  | "guest_count"
  | "services"
  | "duration_hours"
  | "customer_name"
  | "special_requests";

export function greeting(business: BusinessProfile): string {
  return `Ciao, sono l'assistente di ${business.name}. Ti aiuto a richiedere un preventivo su misura per il tuo evento: bastano poche domande.`;
}

export function fieldQuestion(field: InterviewField): string {
  switch (field) {
    case "event_type":
      return "Che tipo di evento stai organizzando? Un matrimonio, una festa privata o un evento pubblico?";
    case "event_date":
      return "Quando si terrà l'evento? Se hai già la data esatta, ancora meglio.";
    case "location":
      return "Dove si svolgerà? Scrivimi la location e la città.";
    case "guest_count":
      return "Quanti invitati sarete, più o meno?";
    case "services":
      return "Quali servizi ti interessano? DJ set, musica live, luci, impianto audio: puoi sceglierne anche più di uno.";
    case "duration_hours":
      return 'Per quante ore indicativamente ti serve il servizio? (es. "6 ore" oppure "dalle 19 all\'1")';
    case "customer_name":
      return "Siamo quasi alla fine. Come ti chiami?";
    case "special_requests":
      return 'Ultima cosa: hai richieste particolari? (brani speciali, momenti da accompagnare) Se no, scrivi pure "no".';
  }
}

export function priceQuestionReply(): string {
  return "Per i prezzi: ogni preventivo è su misura, quindi non ho un listino da darti. Appena ho tutti i dettagli, il titolare ti manda la sua proposta personalizzata, senza impegno.";
}

export function collectionCompleteMessage(
  request: QuoteRequest,
  business: BusinessProfile,
): string {
  const firstName = request.customer_name?.split(" ")[0];
  const recap = [
    `Evento: ${eventTypeLabel(request.event_type)} — ${request.event_date ?? request.event_date_raw ?? "data da definire"}`,
    `Luogo: ${request.location ?? "da definire"}`,
    `Ospiti: ${request.guest_count ?? "da definire"}`,
    `Servizi: ${serviceLabels(request.services, business)}`,
    `Durata: ${request.duration_hours != null ? `${request.duration_hours} ore` : "da definire"}`,
  ].join("\n");
  const thanks = firstName ? `Grazie ${firstName}.` : "Grazie.";
  return `${thanks} Ecco il riepilogo della tua richiesta:\n\n${recap}\n\nHo inoltrato tutto al titolare: riceverai il preventivo su misura al più presto, di solito entro poche ore.`;
}

/** Reply to customer messages after the request was handed to the owner. */
export function afterHandoffReply(status: string): string {
  if (status === "quoted") {
    return "Grazie del messaggio. Il tuo preventivo è già stato inviato: ho girato la tua richiesta al titolare, che ti risponderà direttamente qui.";
  }
  return "Grazie del messaggio. Il tuo preventivo è in preparazione: ho girato la tua nota al titolare, ti risponderà al più presto.";
}

/** Forward of a post-handoff customer message to the owner. */
export function forwardToOwner(
  request: QuoteRequest,
  text: string,
): string {
  return `Messaggio da ${request.customer_name ?? "cliente"} (+${request.customer_phone}) sulla richiesta #${request.id}:\n«${text}»`;
}

/** Fallback when message processing fails unexpectedly. */
export const AI_UNAVAILABLE_MESSAGE =
  "Grazie per il tuo messaggio. In questo momento non riusciamo a risponderti automaticamente, ma ti ricontattiamo al più presto.";

/** Reply for non-text messages (audio, images, ...). */
export const UNSUPPORTED_MEDIA_MESSAGE =
  "Al momento riesco a leggere solo messaggi di testo. Puoi scrivermi i dettagli del tuo evento?";

export function ownerHelp(): string {
  return [
    "Comandi disponibili:",
    "  <id> prezzo <importo>   → imposta il prezzo e genera testo + PDF da inviare tu (es: 42 prezzo 900)",
    "  <id> nota <testo>       → aggiunge una nota al preventivo",
    "  <id> inviato            → segna il preventivo come inviato (dopo che l'hai mandato tu)",
    "  <id> rifiuta <motivo?>  → declina la richiesta",
    "  <id> vinto | <id> perso → chiude una richiesta preventivata",
    "  lista                   → mostra le richieste aperte",
  ].join("\n");
}
