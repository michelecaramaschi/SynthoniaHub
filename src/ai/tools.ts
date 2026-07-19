import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { BetaRunnableTool } from "@anthropic-ai/sdk/lib/tools/BetaRunnableTool";
import type { QuoteRequestRepository } from "../db/repositories.js";

const SERVICE_IDS = [
  "dj_set",
  "musica_live",
  "luci",
  "impianto_audio",
  "altro",
] as const;

export interface CustomerTools {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- BetaRunnableTool is invariant in its input type
  tools: BetaRunnableTool<any>[];
  /** True once complete_info_collection fired during the turn. */
  isComplete(): boolean;
  /** One-line summary for the owner, provided by the model on completion. */
  summaryForOwner(): string | undefined;
}

/** Builds the extraction tools bound to one quote request. */
export function createCustomerTools(
  repo: QuoteRequestRepository,
  requestId: number,
): CustomerTools {
  let completed = false;
  let summary: string | undefined;

  const updateQuoteDetails = betaZodTool({
    name: "update_quote_details",
    description:
      "Registra i dettagli dell'evento forniti dal cliente, anche parziali. " +
      "Chiamala ogni volta che un messaggio contiene informazioni nuove o corrette.",
    inputSchema: z.object({
      customer_name: z.string().optional().describe("Nome del cliente"),
      event_type: z
        .enum(["matrimonio", "festa_privata", "evento_pubblico"])
        .optional(),
      event_date: z
        .string()
        .optional()
        .describe("Data ISO YYYY-MM-DD, solo se determinabile con certezza"),
      event_date_raw: z
        .string()
        .optional()
        .describe("La data con le parole esatte del cliente"),
      location: z.string().optional().describe("Location e città dell'evento"),
      guest_count: z.number().int().positive().optional(),
      services: z.array(z.enum(SERVICE_IDS)).optional(),
      duration_hours: z.number().positive().optional(),
      special_requests: z
        .string()
        .optional()
        .describe("Richieste speciali o note del cliente"),
    }),
    run: (input) => {
      repo.patch(requestId, input);
      return "Dettagli salvati.";
    },
  });

  const completeInfoCollection = betaZodTool({
    name: "complete_info_collection",
    description:
      "Chiamala SOLO quando tipo evento, data, luogo, numero ospiti, servizi e durata " +
      "sono tutti noti. Inoltra la richiesta al titolare per il preventivo.",
    inputSchema: z.object({
      summary_for_owner: z
        .string()
        .describe(
          "Riepilogo di una riga per il titolare, con eventuali dettagli utili non catturati dai campi",
        ),
    }),
    run: (input) => {
      completed = true;
      summary = input.summary_for_owner;
      return "Richiesta pronta per il titolare.";
    },
  });

  return {
    tools: [updateQuoteDetails, completeInfoCollection],
    isComplete: () => completed,
    summaryForOwner: () => summary,
  };
}
