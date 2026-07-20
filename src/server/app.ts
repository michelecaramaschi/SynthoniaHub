import express from "express";
import type { AppConfig } from "../config.js";
import type { Router } from "../core/router.js";
import { createWebhookRouter } from "./webhook.js";
import { createConfirmRouter, type ConfirmDeps } from "./confirm.js";

export function createApp(
  config: AppConfig,
  router: Router,
  confirmDeps?: ConfirmDeps,
): express.Express {
  const app = express();

  // Capture the raw body: Meta's signature is computed over the exact bytes.
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  // The customer confirmation page posts a plain HTML form.
  app.use(express.urlencoded({ extended: false }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/webhook", createWebhookRouter(config, router));

  if (confirmDeps) {
    app.use("/conferma", createConfirmRouter(confirmDeps));
  }

  return app;
}
