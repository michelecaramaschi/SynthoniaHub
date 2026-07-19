import { beforeEach, describe, expect, it } from "vitest";
import { loadConfig, type AppConfig } from "../src/config.js";
import { openDatabase } from "../src/db/database.js";
import { QuoteRequestRepository } from "../src/db/repositories.js";
import {
  detectEventType,
  detectServices,
  parseDuration,
  parseGuestCount,
  parseItalianDate,
  runGuidedTurn,
} from "../src/core/guided-conversation.js";

const NOW = new Date("2026-01-15T12:00:00Z");

describe("extractors", () => {
  it("detects event types", () => {
    expect(detectEventType("ci sposiamo a settembre")).toBe("matrimonio");
    expect(detectEventType("è un matrimonio")).toBe("matrimonio");
    expect(detectEventType("il compleanno dei 40 anni")).toBe("festa_privata");
    expect(detectEventType("una sagra di paese")).toBe("evento_pubblico");
    expect(detectEventType("evento aziendale")).toBe("evento_pubblico");
    expect(detectEventType("una festa")).toBe("festa_privata");
    expect(detectEventType("boh non so")).toBeNull();
  });

  it("parses numeric dates", () => {
    expect(parseItalianDate("il 12/09/2026", NOW)).toEqual({
      iso: "2026-09-12",
      raw: "12/09/2026",
    });
    expect(parseItalianDate("12-9-26", NOW)).toEqual({
      iso: "2026-09-12",
      raw: "12-9-26",
    });
  });

  it("parses textual dates and infers the next year", () => {
    expect(parseItalianDate("12 settembre 2026", NOW)).toEqual({
      iso: "2026-09-12",
      raw: "12 settembre 2026",
    });
    // No year, month already passed relative to NOW (Jan) -> same year
    expect(parseItalianDate("il 20 di giugno", NOW)?.iso).toBe("2026-06-20");
    // No year, and the day is before NOW -> next year
    expect(parseItalianDate("5 gennaio", NOW)?.iso).toBe("2027-01-05");
  });

  it("returns null for unparseable dates", () => {
    expect(parseItalianDate("sabato prossimo", NOW)).toBeNull();
    expect(parseItalianDate("ancora da decidere", NOW)).toBeNull();
  });

  it("detects services (multiple in one message)", () => {
    expect(detectServices("vorrei dj set con luci e impianto audio")).toEqual([
      "dj_set",
      "luci",
      "impianto_audio",
    ]);
    expect(detectServices("un cantante dal vivo")).toEqual(["musica_live"]);
    expect(detectServices("niente di che")).toEqual([]);
  });

  it("parses guest counts", () => {
    expect(parseGuestCount("saremo circa 120 invitati", false)).toBe(120);
    expect(parseGuestCount("sui 80", false)).toBe(80);
    expect(parseGuestCount("200", true)).toBe(200);
    expect(parseGuestCount("200", false)).toBeNull();
  });

  it("parses durations from hours and time ranges", () => {
    expect(parseDuration("direi 6 ore", false)).toBe(6);
    expect(parseDuration("dalle 19 all'1", false)).toBe(6);
    expect(parseDuration("dalle 20:30 alle 2", false)).toBe(5.5);
    expect(parseDuration("5", true)).toBe(5);
  });
});

describe("runGuidedTurn end-to-end (no AI)", () => {
  let config: AppConfig;
  let quoteRepo: QuoteRequestRepository;

  beforeEach(() => {
    config = loadConfig({
      OWNER_PHONE: "390000009999",
      DB_PATH: ":memory:",
    } as NodeJS.ProcessEnv);
    const db = openDatabase(":memory:");
    quoteRepo = new QuoteRequestRepository(db);
  });

  function send(phone: string, text: string) {
    const request = quoteRepo.findOrCreateActive(phone);
    return runGuidedTurn({
      quoteRepo,
      request,
      text,
      business: config.business,
      now: NOW,
    });
  }

  it("guides a step-by-step customer to completion", () => {
    const phone = "393331234567";

    let r = send(phone, "Ciao!");
    expect(r.completed).toBe(false);
    expect(r.reply.toLowerCase()).toContain("tipo di evento");

    r = send(phone, "un matrimonio");
    expect(r.reply.toLowerCase()).toContain("quando");

    r = send(phone, "il 12 settembre 2026");
    expect(r.reply.toLowerCase()).toContain("dove");

    r = send(phone, "Villa Le Rose, Bergamo");
    expect(r.reply.toLowerCase()).toContain("invitati");

    r = send(phone, "circa 120");
    expect(r.reply.toLowerCase()).toContain("servizi");

    r = send(phone, "dj set, luci e audio");
    expect(r.reply.toLowerCase()).toContain("ore");

    r = send(phone, "dalle 19 all'1");
    expect(r.reply.toLowerCase()).toContain("chiami");

    r = send(phone, "Maria Rossi");
    expect(r.reply.toLowerCase()).toContain("richieste particolari");

    r = send(phone, "no");
    expect(r.completed).toBe(true);
    expect(r.reply).toContain("riepilogo");

    const final = quoteRepo.findOrCreateActive(phone);
    expect(final.event_type).toBe("matrimonio");
    expect(final.event_date).toBe("2026-09-12");
    expect(final.location).toBe("Villa Le Rose, Bergamo");
    expect(final.guest_count).toBe(120);
    expect(final.services).toEqual(["dj_set", "luci", "impianto_audio"]);
    expect(final.duration_hours).toBe(6);
    expect(final.customer_name).toBe("Maria Rossi");
  });

  it("extracts multiple fields from a single rich message", () => {
    const phone = "393339999999";
    send(phone, "Ciao!"); // greeting + first question

    const r = send(
      phone,
      "Sono Luca, mi sposo il 20 giugno 2026, saremo 90 invitati, vorrei dj set e impianto audio per 5 ore",
    );
    // Everything except the location is captured in one shot; location is the
    // only field always asked explicitly (free text is too ambiguous).
    expect(r.reply.toLowerCase()).toContain("dove");

    const req = quoteRepo.findOrCreateActive(phone);
    expect(req.event_type).toBe("matrimonio");
    expect(req.event_date).toBe("2026-06-20");
    expect(req.guest_count).toBe(90);
    expect(req.services).toEqual(["dj_set", "impianto_audio"]);
    expect(req.duration_hours).toBe(5);
    expect(req.customer_name).toBe("Luca");

    // After the location, only optional special requests remain.
    const r2 = send(phone, "Villa Erba, Como");
    expect(r2.reply.toLowerCase()).toContain("richieste particolari");
  });

  it("never quotes a price and answers price questions safely", () => {
    const phone = "393330000000";
    send(phone, "Ciao!");
    const r = send(phone, "quanto costa un matrimonio?");
    expect(r.reply.toLowerCase()).toContain("su misura");
    expect(r.reply).not.toMatch(/\d+\s*€|€\s*\d+/);
  });

  it("keeps the customer's words for unparseable dates", () => {
    const phone = "393331111111";
    send(phone, "un matrimonio"); // moves awaiting to event_date
    const r = send(phone, "sabato prossimo, non so ancora la data esatta");
    // Date not parseable but stored raw; flow proceeds to location
    expect(r.reply.toLowerCase()).toContain("dove");
    const req = quoteRepo.findOrCreateActive(phone);
    expect(req.event_date).toBeNull();
    expect(req.event_date_raw).toContain("sabato prossimo");
  });
});
