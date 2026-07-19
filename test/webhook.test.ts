import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import type { AddressInfo } from "node:net";
import { loadConfig } from "../src/config.js";
import { openDatabase } from "../src/db/database.js";
import {
  MessageRepository,
  QuoteRequestRepository,
} from "../src/db/repositories.js";
import { Router } from "../src/core/router.js";
import { createApp } from "../src/server/app.js";
import { parseWebhookPayload } from "../src/whatsapp/payload.js";
import type { MessagingProvider } from "../src/whatsapp/provider.js";

const APP_SECRET = "test-secret";

function metaPayload(text: string, from = "393331234567", id = "wamid.test1") {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "entry-id",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              contacts: [{ wa_id: from, profile: { name: "Maria Rossi" } }],
              messages: [
                {
                  id,
                  from,
                  timestamp: "1750000000",
                  type: "text",
                  text: { body: text },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

function buildTestApp() {
  const config = {
    ...loadConfig({
      OWNER_PHONE: "390000009999",
      DB_PATH: ":memory:",
      APP_SECRET,
      VERIFY_TOKEN: "verify-me",
    } as NodeJS.ProcessEnv),
  };
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
  const app = createApp(config, router);
  return { app, config, db, quoteRepo, messageRepo, sent };
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

describe("payload parsing", () => {
  it("extracts text messages with the profile name", () => {
    const messages = parseWebhookPayload(metaPayload("Ciao!"));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      from: "393331234567",
      text: "Ciao!",
      waMessageId: "wamid.test1",
      profileName: "Maria Rossi",
    });
  });

  it("marks non-text messages with text: null", () => {
    const payload = metaPayload("x");
    const message = payload.entry[0]!.changes[0]!.value.messages[0]! as Record<
      string,
      unknown
    >;
    message.type = "audio";
    delete message.text;
    const messages = parseWebhookPayload(payload);
    expect(messages[0]!.text).toBeNull();
  });

  it("ignores status-only payloads", () => {
    expect(
      parseWebhookPayload({
        object: "whatsapp_business_account",
        entry: [{ changes: [{ field: "messages", value: { statuses: [{}] } }] }],
      }),
    ).toEqual([]);
  });
});

describe("webhook endpoints", () => {
  it("answers the Meta verification handshake", async () => {
    const { app } = buildTestApp();
    await withServer(app, async (baseUrl) => {
      const ok = await fetch(
        `${baseUrl}/webhook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=12345`,
      );
      expect(ok.status).toBe(200);
      expect(await ok.text()).toBe("12345");

      const bad = await fetch(
        `${baseUrl}/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=12345`,
      );
      expect(bad.status).toBe(403);
    });
  });

  it("rejects POSTs with an invalid signature", async () => {
    const { app } = buildTestApp();
    await withServer(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Hub-Signature-256": "sha256=deadbeef",
        },
        body: JSON.stringify(metaPayload("Ciao")),
      });
      expect(response.status).toBe(401);
    });
  });

  it("acks a signed POST and stores the inbound message", async () => {
    const { app, messageRepo, quoteRepo, db } = buildTestApp();
    await withServer(app, async (baseUrl) => {
      // Owner commands skip the AI entirely, so "lista" exercises the whole
      // pipeline (signature -> parse -> router -> reply) without an API key.
      const payload = JSON.stringify(
        metaPayload("lista", "390000009999", "wamid.owner1"),
      );
      const signature = `sha256=${createHmac("sha256", APP_SECRET)
        .update(payload)
        .digest("hex")}`;

      const response = await fetch(`${baseUrl}/webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Hub-Signature-256": signature,
        },
        body: payload,
      });
      expect(response.status).toBe(200);

      // Processing is async after the 200: poll until the message is stored.
      await waitFor(() => {
        const row = db
          .prepare("SELECT COUNT(*) AS n FROM messages WHERE direction = 'in'")
          .get() as { n: number };
        return row.n === 1;
      });
      void messageRepo;
      void quoteRepo;
    });
  });
});

async function waitFor(check: () => boolean, timeoutMs = 2000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (check()) return;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error("Condition not met within timeout");
}
