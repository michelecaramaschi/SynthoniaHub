import { beforeEach, describe, expect, it } from "vitest";
import { loadConfig, type AppConfig } from "../src/config.js";
import { openDatabase } from "../src/db/database.js";
import {
  MessageRepository,
  QuoteRequestRepository,
} from "../src/db/repositories.js";
import { handleOwnerMessage, notifyOwner } from "../src/core/owner-flow.js";
import type { MessagingProvider } from "../src/whatsapp/provider.js";

const OWNER = "390000009999";
const CUSTOMER = "393331234567";

describe("owner approval flow (regex commands, no AI)", () => {
  let config: AppConfig;
  let quoteRepo: QuoteRequestRepository;
  let messageRepo: MessageRepository;
  let sent: Array<{ to: string; body: string }>;
  let deps: Parameters<typeof handleOwnerMessage>[0];
  let requestId: number;

  beforeEach(() => {
    config = loadConfig({
      OWNER_PHONE: OWNER,
      DB_PATH: ":memory:",
    } as NodeJS.ProcessEnv);
    const db = openDatabase(":memory:");
    quoteRepo = new QuoteRequestRepository(db);
    messageRepo = new MessageRepository(db);
    sent = [];
    const provider: MessagingProvider = {
      async sendText(to, body) {
        sent.push({ to, body });
      },
    };
    deps = { config, quoteRepo, messageRepo, provider };

    // Seed a request as if the AI had completed info collection.
    const request = quoteRepo.findOrCreateActive(CUSTOMER);
    quoteRepo.patch(request.id, {
      customer_name: "Maria Rossi",
      event_type: "matrimonio",
      event_date: "2026-09-12",
      event_date_raw: "sabato 12 settembre",
      location: "Villa Le Rose, Bergamo",
      guest_count: 120,
      services: ["dj_set", "impianto_audio", "luci"],
      duration_hours: 6,
      special_requests: "playlist anni '90 per il taglio torta",
    });
    quoteRepo.transition(request.id, "pending_owner");
    requestId = request.id;
  });

  it("notifies the owner with the structured summary", async () => {
    await notifyOwner(deps, quoteRepo.getById(requestId)!, "Coppia molto decisa");
    expect(sent).toHaveLength(1);
    const notification = sent[0]!;
    expect(notification.to).toBe(OWNER);
    expect(notification.body).toContain(`NUOVA RICHIESTA DI PREVENTIVO #${requestId}`);
    expect(notification.body).toContain("Maria Rossi");
    expect(notification.body).toContain("Matrimonio");
    expect(notification.body).toContain("Villa Le Rose, Bergamo");
    expect(notification.body).toContain("Coppia molto decisa");
    expect(notification.body).toContain(`${requestId} prezzo`);
  });

  it("runs the full price -> preview -> inviato -> vinto flow, with the owner sending manually", async () => {
    // 1. Owner sets the price: gets a preview with text + PDF link, ready to
    // copy. Nothing is ever sent to the customer by the bot.
    await handleOwnerMessage(deps, `${requestId} prezzo 1.200,50`);
    expect(sent).toHaveLength(1);
    expect(sent[0]!.to).toBe(OWNER);
    expect(sent[0]!.body).toContain("Testo pronto da inviare al cliente");
    expect(sent[0]!.body).toContain("Ciao Maria,");
    expect(sent[0]!.body).toContain("1.200,50 €");
    expect(sent[0]!.body).toContain("PDF da scaricare e allegare");
    expect(quoteRepo.getById(requestId)!.status).toBe("pending_owner");
    expect(quoteRepo.getById(requestId)!.price_eur).toBe(1200.5);

    // 2. Owner adds a note: preview refreshes, still nothing to the customer.
    await handleOwnerMessage(deps, `${requestId} nota Include tecnico del suono`);
    expect(quoteRepo.getById(requestId)!.owner_notes).toBe("Include tecnico del suono");
    expect(sent.every((m) => m.to === OWNER)).toBe(true);

    // 3. Owner has sent it themselves on WhatsApp, then confirms with "ok":
    // the bot never talks to the customer, it only records the transition.
    sent.length = 0;
    await handleOwnerMessage(deps, `${requestId} ok`);
    expect(sent.find((m) => m.to === CUSTOMER)).toBeUndefined();
    const confirmation = sent.find((m) => m.to === OWNER);
    expect(confirmation!.body).toContain("segnata come inviata");
    expect(quoteRepo.getById(requestId)!.status).toBe("quoted");

    // 4. Owner closes the deal.
    await handleOwnerMessage(deps, `${requestId} vinto`);
    expect(quoteRepo.getById(requestId)!.status).toBe("won");
  });

  it("accepts 'inviato' as an alias for 'ok'", async () => {
    await handleOwnerMessage(deps, `${requestId} prezzo 900`);
    sent.length = 0;
    await handleOwnerMessage(deps, `${requestId} inviato`);
    expect(quoteRepo.getById(requestId)!.status).toBe("quoted");
  });

  it("refuses to mark as sent without a price", async () => {
    await handleOwnerMessage(deps, `${requestId} ok`);
    expect(sent).toHaveLength(1);
    expect(sent[0]!.to).toBe(OWNER);
    expect(sent[0]!.body).toContain("Prima imposta il prezzo");
    expect(quoteRepo.getById(requestId)!.status).toBe("pending_owner");
  });

  it("declines a request and informs the customer", async () => {
    await handleOwnerMessage(deps, `${requestId} rifiuta data già occupata`);
    const toCustomer = sent.find((m) => m.to === CUSTOMER);
    expect(toCustomer!.body).toContain("data già occupata");
    expect(quoteRepo.getById(requestId)!.status).toBe("lost");
  });

  it("lists open requests", async () => {
    await handleOwnerMessage(deps, "lista");
    expect(sent[0]!.body).toContain(`#${requestId}`);
    expect(sent[0]!.body).toContain("da preventivare");
  });
});
