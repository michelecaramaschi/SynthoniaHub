import { describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import { loadConfig } from "../src/config.js";
import { openDatabase } from "../src/db/database.js";
import {
  MessageRepository,
  QuoteRequestRepository,
  type QuoteRequest,
} from "../src/db/repositories.js";
import { Router } from "../src/core/router.js";
import { createApp } from "../src/server/app.js";
import { generateQuotePdf, confirmationUrl } from "../src/quote/pdf.js";
import { escapeHtml } from "../src/quote/confirm-page.js";
import type { MessagingProvider } from "../src/whatsapp/provider.js";

function buildTestApp() {
  const config = loadConfig({
    OWNER_PHONE: "390000009999",
    DB_PATH: ":memory:",
    APP_SECRET: "test-secret",
    VERIFY_TOKEN: "verify-me",
    PUBLIC_BASE_URL: "https://preventivi.synthonia.it",
  } as NodeJS.ProcessEnv);

  const db = openDatabase(":memory:");
  const quoteRepo = new QuoteRequestRepository(db);
  const messageRepo = new MessageRepository(db);
  const sent: Array<{ to: string; body: string }> = [];
  const provider: MessagingProvider = {
    async sendText(to, body) {
      sent.push({ to, body });
    },
  };
  const router = new Router({ config, quoteRepo, messageRepo, provider });
  const app = createApp(config, router, {
    config,
    quoteRepo,
    messageRepo,
    provider,
  });
  return { app, config, db, quoteRepo, messageRepo, sent };
}

/** Creates a request already in `quoted` with a confirmation token. */
function seedQuotedRequest(
  quoteRepo: QuoteRequestRepository,
): { request: QuoteRequest; token: string } {
  const created = quoteRepo.findOrCreateActive("393331234567");
  quoteRepo.patch(created.id, {
    customer_name: "Maria Rossi",
    event_type: "matrimonio",
    event_date: "2026-09-12",
    location: "Villa Reale, Monza",
    guest_count: 120,
    services: ["dj_set"],
    duration_hours: 6,
    price_eur: 1200,
  });
  quoteRepo.transition(created.id, "pending_owner");
  quoteRepo.transition(created.id, "quoted");
  const token = quoteRepo.ensureConfirmationToken(created.id);
  return { request: quoteRepo.getById(created.id)!, token };
}

async function withServer(
  app: ReturnType<typeof buildTestApp>["app"],
  fn: (baseUrl: string) => Promise<void>,
) {
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
  }
}

async function waitFor(check: () => boolean, timeoutMs = 2000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (check()) return;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error("Condition not met within timeout");
}

describe("confirmation token", () => {
  it("is stable across calls so a re-sent quote keeps the same link", () => {
    const { quoteRepo } = buildTestApp();
    const { request } = seedQuotedRequest(quoteRepo);
    const first = quoteRepo.ensureConfirmationToken(request.id);
    const second = quoteRepo.ensureConfirmationToken(request.id);
    expect(second).toBe(first);
  });

  it("resolves back to its request and is unique per request", () => {
    const { quoteRepo } = buildTestApp();
    const a = seedQuotedRequest(quoteRepo);
    const b = quoteRepo.findOrCreateActive("393339999999");
    const bToken = quoteRepo.ensureConfirmationToken(b.id);

    expect(bToken).not.toBe(a.token);
    expect(quoteRepo.getByConfirmationToken(a.token)?.id).toBe(a.request.id);
    expect(quoteRepo.getByConfirmationToken("nope")).toBeNull();
  });
});

describe("confirmByToken", () => {
  it("moves a quoted request to won and records the customer's details", () => {
    const { quoteRepo } = buildTestApp();
    const { token, request } = seedQuotedRequest(quoteRepo);

    const result = quoteRepo.confirmByToken(token, {
      name: "Maria Rossi",
      notes: "Arriviamo alle 18",
    });

    expect(result.outcome).toBe("confirmed");
    const stored = quoteRepo.getById(request.id)!;
    expect(stored.status).toBe("won");
    expect(stored.confirmed_name).toBe("Maria Rossi");
    expect(stored.confirmed_notes).toBe("Arriviamo alle 18");
    expect(stored.confirmed_at).toBeTruthy();
  });

  it("reports already_confirmed on a second click instead of confirming twice", () => {
    const { quoteRepo } = buildTestApp();
    const { token } = seedQuotedRequest(quoteRepo);

    const first = quoteRepo.confirmByToken(token, { name: "Maria" });
    const second = quoteRepo.confirmByToken(token, { name: "Qualcun altro" });

    expect(first.outcome).toBe("confirmed");
    expect(second.outcome).toBe("already_confirmed");
    // The original confirmation is preserved.
    expect(second.request?.confirmed_name).toBe("Maria");
  });

  it("refuses to confirm a request that is not in `quoted`", () => {
    const { quoteRepo } = buildTestApp();
    const created = quoteRepo.findOrCreateActive("393331112222");
    const token = quoteRepo.ensureConfirmationToken(created.id);

    // Still collecting info: nothing to accept yet.
    const result = quoteRepo.confirmByToken(token);
    expect(result.outcome).toBe("not_confirmable");
    expect(quoteRepo.getById(created.id)!.status).toBe("collecting_info");
  });

  it("reports not_found for an unknown token", () => {
    const { quoteRepo } = buildTestApp();
    expect(quoteRepo.confirmByToken("does-not-exist").outcome).toBe("not_found");
  });
});

describe("confirmation endpoints", () => {
  it("shows the quote detail on GET", async () => {
    const { app, quoteRepo } = buildTestApp();
    const { token } = seedQuotedRequest(quoteRepo);

    await withServer(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/conferma/${token}`);
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain("Villa Reale, Monza");
      expect(html).toContain("1.200 €");
      expect(html).toContain("Confermo e accetto il preventivo");
    });
  });

  it("shows the event date in Italian format, not ISO", async () => {
    const { app, quoteRepo } = buildTestApp();
    const { token } = seedQuotedRequest(quoteRepo);

    await withServer(app, async (baseUrl) => {
      const html = await (await fetch(`${baseUrl}/conferma/${token}`)).text();
      expect(html).toContain("12/09/2026");
      expect(html).not.toContain("2026-09-12");
    });
  });

  it("404s an unknown token without leaking whether it ever existed", async () => {
    const { app } = buildTestApp();
    await withServer(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/conferma/ignoto`);
      expect(response.status).toBe(404);
      expect(await response.text()).toContain("Link non disponibile");
    });
  });

  it("records the confirmation and notifies the owner on POST", async () => {
    const { app, quoteRepo, sent, config } = buildTestApp();
    const { token, request } = seedQuotedRequest(quoteRepo);

    await withServer(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/conferma/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          name: "Maria Rossi",
          notes: "Confermo tutto",
        }),
      });

      expect(response.status).toBe(200);
      expect(await response.text()).toContain("Preventivo confermato");
      expect(quoteRepo.getById(request.id)!.status).toBe("won");

      // The owner alert is fired after the response, so wait for it.
      await waitFor(() => sent.length === 1);
      expect(sent[0]!.to).toBe(config.ownerPhone);
      expect(sent[0]!.body).toContain(`PREVENTIVO #${request.id} CONFERMATO`);
      expect(sent[0]!.body).toContain("Maria Rossi");
      expect(sent[0]!.body).toContain("Confermo tutto");
      expect(sent[0]!.body).toContain("1.200 €");
    });
  });

  it("stays idempotent when the customer submits twice", async () => {
    const { app, quoteRepo, sent } = buildTestApp();
    const { token } = seedQuotedRequest(quoteRepo);

    await withServer(app, async (baseUrl) => {
      const post = () =>
        fetch(`${baseUrl}/conferma/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ name: "Maria Rossi" }),
        });

      await post();
      await waitFor(() => sent.length === 1);

      const second = await post();
      expect(second.status).toBe(200);
      expect(await second.text()).toContain("già confermato");
      // No second alert to the owner.
      await new Promise((r) => setTimeout(r, 100));
      expect(sent).toHaveLength(1);
    });
  });
});

describe("confirm page escaping", () => {
  it("escapes HTML metacharacters so customer data cannot inject markup", () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
  });

  it("renders a customer name containing markup as text", async () => {
    const { app, quoteRepo } = buildTestApp();
    const { token, request } = seedQuotedRequest(quoteRepo);
    quoteRepo.patch(request.id, { location: '<img src=x onerror="alert(1)">' });

    await withServer(app, async (baseUrl) => {
      const html = await (await fetch(`${baseUrl}/conferma/${token}`)).text();
      expect(html).not.toContain("<img src=x");
      expect(html).toContain("&lt;img src=x");
    });
  });
});

describe("quote PDF", () => {
  it("builds a confirmation URL from the public base", () => {
    expect(confirmationUrl("https://x.it/", "abc")).toBe(
      "https://x.it/conferma/abc",
    );
  });

  it("renders a PDF carrying the confirmation link", async () => {
    const { quoteRepo, config } = buildTestApp();
    const { request, token } = seedQuotedRequest(quoteRepo);

    const pdf = await generateQuotePdf({
      request,
      business: config.business,
      confirmUrl: confirmationUrl(config.publicBaseUrl, token),
      now: new Date("2026-07-21T10:00:00Z"),
    });

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(1000);
    // The link is stored as an annotation URI in the PDF body.
    expect(pdf.toString("latin1")).toContain("preventivi.synthonia.it");
  });

  it("refuses to render a quote with no price", async () => {
    const { quoteRepo, config } = buildTestApp();
    const created = quoteRepo.findOrCreateActive("393334445555");

    await expect(
      generateQuotePdf({
        request: quoteRepo.getById(created.id)!,
        business: config.business,
        confirmUrl: "https://x.it/conferma/abc",
      }),
    ).rejects.toThrow(/no price/i);
  });
});
