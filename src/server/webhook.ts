import express from "express";
import type { AppConfig } from "../config.js";
import type { Router } from "../core/router.js";
import { verifyMetaSignature } from "../whatsapp/signature.js";
import { parseWebhookPayload } from "../whatsapp/payload.js";

export function createWebhookRouter(
  config: AppConfig,
  router: Router,
): express.Router {
  const webhookRouter = express.Router();

  // Meta webhook verification handshake (hub.challenge).
  webhookRouter.get("/", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === config.verifyToken && challenge) {
      res.status(200).send(String(challenge));
      return;
    }
    res.sendStatus(403);
  });

  webhookRouter.post("/", (req, res) => {
    const rawBody = (req as express.Request & { rawBody?: Buffer }).rawBody;
    const signature = req.header("X-Hub-Signature-256");
    if (
      !rawBody ||
      !config.appSecret ||
      !verifyMetaSignature(rawBody, signature, config.appSecret)
    ) {
      res.sendStatus(401);
      return;
    }

    // Ack immediately: Meta retries slow webhooks, and Claude calls take seconds.
    res.sendStatus(200);

    const messages = parseWebhookPayload(req.body);
    for (const message of messages) {
      void router
        .handleInbound({
          from: message.from,
          text: message.text,
          waMessageId: message.waMessageId,
          profileName: message.profileName,
        })
        .catch((error) => {
          console.error("Inbound processing failed:", error);
        });
    }
  });

  return webhookRouter;
}
