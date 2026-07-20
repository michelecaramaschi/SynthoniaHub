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

  it("runs the full price -> preview -> ok -> vinto flow", async () => {
    // 1. Owner sets the price: gets a preview, nothing goes to the customer yet.
    await handleOwnerMessage(deps, `${requestId} prezzo 1.200,50`);
    expect(sent).toHaveLength(1);
    expect(sent[0]!.to).toBe(OWNER);
    expect(sent[0]!.body).toContain("Anteprima");
    expect(sent[0]!.body).toContain("1.200,50 €");
    expect(quoteRepo.getById(requestId)!.status).toBe("pending_owner");
    expect(quoteRepo.getById(requestId)!.price_eur).toBe(1200.5);

    // 2. Owner adds a note.
    await handleOwnerMessage(deps, `${requestId} nota Include tecnico del suono`);
    expect(quoteRepo.getById(requestId)!.owner_notes).toBe("Include tecnico del suono");

    // 3. Owner approves: the quote goes to the customer.
    sent.length = 0;
    await handleOwnerMessage(deps, `${requestId} ok`);
    const toCustomer = sent.find((m) => m.to === CUSTOMER);
    expect(toCustomer).toBeDefined();
    expect(toCustomer!.body).toContain("Ciao Maria,");
    expect(toCustomer!.body).toContain("1.200,50 €");
    expect(toCustomer!.body).toContain("Include tecnico del suono");
    expect(quoteRepo.getById(requestId)!.status).toBe("quoted");
    const confirmation = sent.find((m) => m.to === OWNER);
    expect(confirmation!.body).toContain("inviato");

    // 4. Owner closes the deal.
    await handleOwnerMessage(deps, `${requestId} vinto`);
    expect(quoteRepo.getById(requestId)!.status).toBe("won");
  });

  it("refuses to approve without a price", async () => {
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
