/**
 * Guided, deterministic conversation flow — no AI API involved.
 *
 * The bot asks one question at a time (tracked by `awaiting_field` on the
 * quote request) but opportunistically extracts every field it can from each
 * message, so customers who write everything in one go skip ahead.
 */
import type {
  QuoteRequest,
  QuoteRequestPatch,
  QuoteRequestRepository,
} from "../db/repositories.js";
import type { BusinessProfile } from "../config.js";
import {
  collectionCompleteMessage,
  fieldQuestion,
  greeting,
  priceQuestionReply,
  type InterviewField,
} from "./templates.js";

/** Interview order: required fields first, optional special requests last. */
const REQUIRED_FIELDS: InterviewField[] = [
  "event_type",
  "event_date",
  "location",
  "guest_count",
  "services",
  "duration_hours",
  "customer_name",
];

const MONTHS: Record<string, number> = {
  gennaio: 1,
  febbraio: 2,
  marzo: 3,
  aprile: 4,
  maggio: 5,
  giugno: 6,
  luglio: 7,
  agosto: 8,
  settembre: 9,
  ottobre: 10,
  novembre: 11,
  dicembre: 12,
};

export function detectEventType(text: string): string | null {
  const t = text.toLowerCase();
  if (/matrimoni|sposiam|nozze|sposa\b|sposo\b|ricevimento nuziale/.test(t)) {
    return "matrimonio";
  }
  if (
    /compleanno|anniversario|laurea|diciottesim|battesimo|comunione|cresima|festa privata|festa di|addio al/.test(
      t,
    )
  ) {
    return "festa_privata";
  }
  if (
    /sagra|evento pubblico|in piazza|aziendale|inaugurazione|festival|fiera|comune di/.test(
      t,
    )
  ) {
    return "evento_pubblico";
  }
  if (/\bfesta\b/.test(t)) return "festa_privata";
  return null;
}

export interface ParsedDate {
  iso: string | null;
  raw: string;
}

/** Parses "12/09/2026", "12 settembre 2026", "12 settembre" (next occurrence). */
export function parseItalianDate(text: string, now: Date): ParsedDate | null {
  // Numeric: dd/mm/yyyy, dd-mm-yyyy, dd.mm.yy
  let m = text.match(/\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    let year = Number(m[3]);
    if (year < 100) year += 2000;
    if (isValidDate(year, month, day)) {
      return { iso: toIso(year, month, day), raw: m[0] };
    }
  }

  // Textual: "12 settembre 2026", "il 12 di settembre", "1° maggio"
  const monthNames = Object.keys(MONTHS).join("|");
  m = text
    .toLowerCase()
    .match(
      new RegExp(`\\b(\\d{1,2})(?:°|º)?\\s+(?:di\\s+)?(${monthNames})(?:\\s+(\\d{4}))?`),
    );
  if (m) {
    const day = Number(m[1]);
    const month = MONTHS[m[2]!]!;
    let year = m[3] ? Number(m[3]) : now.getFullYear();
    if (!m[3]) {
      // No year given: assume the next occurrence.
      const candidate = new Date(Date.UTC(year, month - 1, day));
      const today = new Date(
        Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
      );
      if (candidate < today) year += 1;
    }
    if (isValidDate(year, month, day)) {
      return { iso: toIso(year, month, day), raw: m[0] };
    }
  }

  return null;
}

function isValidDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function detectServices(text: string): string[] {
  const t = text.toLowerCase();
  const services = new Set<string>();
  if (/\bdj\b|dj set|deejay/.test(t)) services.add("dj_set");
  if (/live|band|musicisti|cantante|sax|violino|chitarrista|duo\b|trio\b/.test(t)) {
    services.add("musica_live");
  }
  if (/\bluci\b|\bluce\b|illuminazione/.test(t)) services.add("luci");
  if (/audio|impianto|casse|microfon|amplificazione/.test(t)) {
    services.add("impianto_audio");
  }
  return [...services];
}

export function parseGuestCount(text: string, isCurrentQuestion: boolean): number | null {
  let m = text.match(
    /(\d{1,4})\s*(?:invitati|ospiti|persone|pax|partecipanti)/i,
  );
  if (!m) m = text.match(/(?:circa|sui|intorno a|più o meno)\s+(\d{1,4})\b/i);
  if (!m && isCurrentQuestion) m = text.match(/\b(\d{1,4})\b/);
  if (!m) return null;
  const n = Number(m[1]);
  return n > 0 ? n : null;
}

export function parseDuration(text: string, isCurrentQuestion: boolean): number | null {
  let m = text.match(/(\d{1,2}(?:[.,]\d)?)\s*or[ae]\b/i);
  if (m) {
    const hours = Number(m[1]!.replace(",", "."));
    return hours > 0 && hours <= 24 ? hours : null;
  }
  // "dalle 19 alle 24", "dalle 19 all'1", "dalle 19:30 fino alle 2"
  m = text.match(
    /dall?e?\s*(\d{1,2})(?:[:.](\d{2}))?\s*(?:fino\s+)?(?:alle?|all')\s*(\d{1,2})(?:[:.](\d{2}))?/i,
  );
  if (m) {
    const start = Number(m[1]) + Number(m[2] ?? 0) / 60;
    const end = Number(m[3]) + Number(m[4] ?? 0) / 60;
    const duration = (end - start + 24) % 24;
    return duration > 0 ? Math.round(duration * 2) / 2 : null;
  }
  if (isCurrentQuestion) {
    m = text.match(/\b(\d{1,2})\b/);
    if (m) {
      const hours = Number(m[1]);
      return hours > 0 && hours <= 24 ? hours : null;
    }
  }
  return null;
}

export function extractName(text: string, isCurrentQuestion: boolean): string | null {
  const m = text.match(
    /(?:mi chiamo|il mio nome è|sono la |sono il |sono )\s*([A-ZÀ-Ù][a-zA-Zà-ùÀ-Ù']+(?:\s+[A-ZÀ-Ù][a-zA-Zà-ùÀ-Ù']+)?)/i,
  );
  if (m) return m[1]!.trim();
  if (isCurrentQuestion) {
    const cleaned = text.replace(/[!.]/g, "").trim();
    const words = cleaned.split(/\s+/);
    if (
      words.length >= 1 &&
      words.length <= 4 &&
      !/\d/.test(cleaned) &&
      cleaned.length <= 60
    ) {
      return cleaned;
    }
  }
  return null;
}

function isNegative(text: string): boolean {
  return /^\s*(no|nulla|niente|nessuna|nessuno|non credo|no grazie|tutto ok|va bene così)[\s!.]*$/i.test(
    text,
  );
}

function asksForPrice(text: string): boolean {
  return /prezz|cost[aoi]|quanto viene|quanto verrebbe|tariff|spesa|budget/i.test(text);
}

export interface GuidedTurnResult {
  reply: string;
  /** True when all information is collected and the owner should be notified. */
  completed: boolean;
}

/**
 * Processes one customer message during info collection.
 * Field writes happen through the repository; the caller handles the
 * pending_owner transition and owner notification when `completed` is true.
 */
export function runGuidedTurn(params: {
  quoteRepo: QuoteRequestRepository;
  request: QuoteRequest;
  text: string;
  business: BusinessProfile;
  now?: Date;
}): GuidedTurnResult {
  const { quoteRepo, request, text, business } = params;
  const now = params.now ?? new Date();
  const awaiting = request.awaiting_field as InterviewField | "done" | null;
  const isFirstMessage = awaiting === null;

  const patch: QuoteRequestPatch = {};
  let extractedSomething = false;

  // Opportunistic extraction from every message.
  if (!request.event_type) {
    const eventType = detectEventType(text);
    if (eventType) {
      patch.event_type = eventType;
      extractedSomething = true;
    }
  }
  if (!request.event_date && !request.event_date_raw) {
    const date = parseItalianDate(text, now);
    if (date) {
      if (date.iso) patch.event_date = date.iso;
      patch.event_date_raw = date.raw;
      extractedSomething = true;
    } else if (awaiting === "event_date") {
      // Couldn't parse ("sabato prossimo", "ancora da decidere"):
      // keep the customer's words so the owner sees them, don't block.
      patch.event_date_raw = text.trim();
      extractedSomething = true;
    }
  }
  {
    const services = detectServices(text);
    if (services.length > 0) {
      const merged = new Set([...(request.services ?? []), ...services]);
      patch.services = [...merged];
      extractedSomething = true;
    }
  }
  if (request.guest_count == null) {
    const guests = parseGuestCount(text, awaiting === "guest_count");
    if (guests != null) {
      patch.guest_count = guests;
      extractedSomething = true;
    }
  }
  if (request.duration_hours == null) {
    const duration = parseDuration(text, awaiting === "duration_hours");
    if (duration != null) {
      patch.duration_hours = duration;
      extractedSomething = true;
    }
  }
  {
    const name = extractName(text, awaiting === "customer_name");
    if (name && (awaiting === "customer_name" || !request.customer_name)) {
      patch.customer_name = name;
      extractedSomething = true;
    }
  }
  if (awaiting === "location" && !patch.location && !request.location) {
    const cleaned = text.trim();
    if (cleaned.length > 0 && cleaned.length <= 120) {
      patch.location = cleaned;
      extractedSomething = true;
    }
  }

  // Answer to the final, optional special-requests question.
  let specialAnswered = false;
  if (awaiting === "special_requests") {
    if (!isNegative(text)) {
      const existing = request.special_requests;
      patch.special_requests = existing ? `${existing}; ${text.trim()}` : text.trim();
    }
    specialAnswered = true;
  }

  const updated = quoteRepo.patch(request.id, patch);

  // Decide the next step.
  const missing = REQUIRED_FIELDS.filter((field) => isMissing(updated, field));

  const parts: string[] = [];
  if (isFirstMessage) parts.push(greeting(business));
  if (asksForPrice(text)) parts.push(priceQuestionReply());

  if (missing.length > 0) {
    const nextField = missing[0]!;
    if (!isFirstMessage && extractedSomething) parts.push("Perfetto, segnato.");
    parts.push(fieldQuestion(nextField));
    quoteRepo.patch(request.id, { awaiting_field: nextField });
    return { reply: parts.join("\n\n"), completed: false };
  }

  if (!specialAnswered && awaiting !== "done") {
    parts.push(fieldQuestion("special_requests"));
    quoteRepo.patch(request.id, { awaiting_field: "special_requests" });
    return { reply: parts.join("\n\n"), completed: false };
  }

  // Everything collected: thank the customer and hand over to the owner.
  quoteRepo.patch(request.id, { awaiting_field: "done" });
  const final = quoteRepo.getById(request.id)!;
  parts.push(collectionCompleteMessage(final, business));
  return { reply: parts.join("\n\n"), completed: true };
}

function isMissing(request: QuoteRequest, field: InterviewField): boolean {
  switch (field) {
    case "event_type":
      return request.event_type == null;
    case "event_date":
      return request.event_date == null && request.event_date_raw == null;
    case "location":
      return request.location == null;
    case "guest_count":
      return request.guest_count == null;
    case "services":
      return request.services == null || request.services.length === 0;
    case "duration_hours":
      return request.duration_hours == null;
    case "customer_name":
      return request.customer_name == null;
    case "special_requests":
      return false; // optional
  }
}
