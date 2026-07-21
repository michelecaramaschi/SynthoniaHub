import express from "express";
import type { AppConfig } from "../config.js";
import type { QuoteRequestRepository } from "../db/repositories.js";
import { confirmationUrl, generateQuotePdf } from "../quote/pdf.js";

export interface PdfRouteDeps {
  config: AppConfig;
  quoteRepo: QuoteRequestRepository;
}

/**
 * Serves the quote PDF for the owner to download and forward manually.
 *
 * Uses the same confirmation token as `/conferma/:token`: it is already
 * unguessable and scoped to one request, so no separate auth is needed here.
 */
export function createPdfRouter(deps: PdfRouteDeps): express.Router {
  const router = express.Router();
  const { config, quoteRepo } = deps;

  router.get("/:token", async (req, res) => {
    const request = quoteRepo.getByConfirmationToken(req.params.token);

    if (!request || request.price_eur == null) {
      res.status(404).send("Preventivo non trovato o non ancora pronto.");
      return;
    }

    const confirmUrl = confirmationUrl(config.publicBaseUrl, req.params.token);
    const pdf = await generateQuotePdf({
      request,
      business: config.business,
      confirmUrl,
    });

    res.type("application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="preventivo-${request.id}.pdf"`,
    );
    res.send(pdf);
  });

  return router;
}
