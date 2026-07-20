import express from "express";
import type { AppConfig } from "../config.js";
import type {
  MessageRepository,
  QuoteRequestRepository,
} from "../db/repositories.js";
import type { MessagingProvider } from "../whatsapp/provider.js";
import { confirmationNotification } from "../core/templates.js";
import {
  confirmFormPage,
  confirmedPage,
  unavailablePage,
} from "../quote/confirm-page.js";

export interface ConfirmDeps {
  config: AppConfig;
  quoteRepo: QuoteRequestRepository;
  messageRepo: MessageRepository;
  provider: MessagingProvider;
}

const NOT_FOUND_MESSAGE =
  "Il link di conferma non è valido o è scaduto. Contattaci su WhatsApp e te ne inviamo uno nuovo.";

/**
 * Public, unauthenticated routes the customer reaches from the PDF link.
 * The token is the only credential, so it is never echoed back into the page.
 */
export function createConfirmRouter(deps: ConfirmDeps): express.Router {
  const router = express.Router();
  const { config, quoteRepo, messageRepo, provider } = deps;

  router.get("/:token", (req, res) => {
    const token = req.params.token;
    const request = quoteRepo.getByConfirmationToken(token);

    if (!request) {
      res.status(404).type("html").send(unavailablePage(config.business, NOT_FOUND_MESSAGE));
      return;
    }
    if (request.status === "won") {
      res.type("html").send(confirmedPage(request, config.business, true));
      return;
    }
    if (request.status !== "quoted") {
      res
        .status(409)
        .type("html")
        .send(
          unavailablePage(
            config.business,
            "Questo preventivo non è al momento confermabile. Scrivici su WhatsApp per aggiornamenti.",
          ),
        );
      return;
    }

    res.type("html").send(confirmFormPage(request, config.business, token));
  });

  router.post("/:token", (req, res) => {
    const token = req.params.token;
    const body = (req.body ?? {}) as { name?: unknown; notes?: unknown };
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : undefined;
    const notes =
      typeof body.notes === "string" ? body.notes.trim().slice(0, 1000) : undefined;

    const { outcome, request } = quoteRepo.confirmByToken(token, {
      name: name || undefined,
      notes: notes || undefined,
    });

    if (outcome === "not_found" || !request) {
      res.status(404).type("html").send(unavailablePage(config.business, NOT_FOUND_MESSAGE));
      return;
    }
    if (outcome === "already_confirmed") {
      res.type("html").send(confirmedPage(request, config.business, true));
      return;
    }
    if (outcome === "not_confirmable") {
      res
        .status(409)
        .type("html")
        .send(
          unavailablePage(
            config.business,
            "Questo preventivo non è al momento confermabile. Scrivici su WhatsApp per aggiornamenti.",
          ),
        );
      return;
    }

    // The customer already has their answer; notifying the owner must not block it.
    res.type("html").send(confirmedPage(request, config.business));

    const notification = confirmationNotification(request, config.business);
    void provider
      .sendText(config.ownerPhone, notification)
      .then(() => {
        messageRepo.recordOutbound(request.id, notification);
      })
      .catch((error: unknown) => {
        console.error(
          `[conferma] notifica al titolare fallita per #${request.id}:`,
          error,
        );
      });
  });

  return router;
}
