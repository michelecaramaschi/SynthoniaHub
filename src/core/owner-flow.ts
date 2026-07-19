import type { AppConfig } from "../config.js";
import type {
  MessageRepository,
  QuoteRequest,
  QuoteRequestRepository,
} from "../db/repositories.js";
import type { MessagingProvider } from "../whatsapp/provider.js";
import {
  parseOwnerCommand,
  parseOwnerCommandWithAI,
  type OwnerCommand,
} from "../ai/owner-parser.js";
import {
  declineMessage,
  eventTypeLabel,
  ownerHelp,
  ownerNotification,
  quoteMessage,
} from "./templates.js";

export interface OwnerFlowDeps {
  config: AppConfig;
  quoteRepo: QuoteRequestRepository;
  messageRepo: MessageRepository;
  provider: MessagingProvider;
}

/** Sends the structured summary to the owner when a request is ready. */
export async function notifyOwner(
  deps: OwnerFlowDeps,
  request: QuoteRequest,
  aiSummary?: string,
): Promise<void> {
  const body = ownerNotification(request, deps.config.business, aiSummary);
  await deps.provider.sendText(deps.config.ownerPhone, body);
  deps.messageRepo.recordOutbound(request.id, body);
}

/** Handles an inbound message from the owner's phone. */
export async function handleOwnerMessage(
  deps: OwnerFlowDeps,
  text: string,
): Promise<void> {
  const { config, quoteRepo } = deps;

  let command: OwnerCommand | null = parseOwnerCommand(text);
  if (!command) {
    const openRequests = quoteRepo.listByStatus(["pending_owner", "quoted"]);
    command = await parseOwnerCommandWithAI(text, openRequests, config);
  }

  await executeOwnerCommand(deps, command);
}

async function executeOwnerCommand(
  deps: OwnerFlowDeps,
  command: OwnerCommand,
): Promise<void> {
  const { config, quoteRepo, messageRepo, provider } = deps;
  const replyToOwner = async (body: string) => {
    await provider.sendText(config.ownerPhone, body);
    messageRepo.recordOutbound(null, body);
  };

  if (command.action === "unknown") {
    await replyToOwner(
      `Non ho capito il comando. 🤔\n\n${ownerHelp()}`,
    );
    return;
  }

  if (command.action === "list") {
    const open = quoteRepo.listByStatus(["pending_owner", "quoted"]);
    if (open.length === 0) {
      await replyToOwner("Nessuna richiesta aperta al momento. ✅");
      return;
    }
    const lines = open.map((r) => {
      const status = r.status === "pending_owner" ? "da preventivare" : "preventivo inviato";
      const price = r.price_eur != null ? ` — ${r.price_eur}€` : "";
      return `#${r.id} [${status}] ${eventTypeLabel(r.event_type)} di ${r.customer_name ?? "cliente"} — ${r.event_date ?? r.event_date_raw ?? "data n/d"}${price}`;
    });
    await replyToOwner(`Richieste aperte:\n${lines.join("\n")}`);
    return;
  }

  const request = quoteRepo.getById(command.requestId);
  if (!request) {
    await replyToOwner(`Non trovo la richiesta #${command.requestId}. Scrivi "lista" per vedere quelle aperte.`);
    return;
  }

  switch (command.action) {
    case "set_price": {
      if (request.status !== "pending_owner") {
        await replyToOwner(
          `La richiesta #${request.id} non è in attesa di preventivo (stato: ${request.status}).`,
        );
        return;
      }
      const updated = quoteRepo.patch(request.id, { price_eur: command.priceEur });
      const preview = quoteMessage(updated, config.business);
      await replyToOwner(
        `Prezzo impostato: ${command.priceEur}€ per la richiesta #${request.id}.\n\nAnteprima del messaggio al cliente:\n────────────\n${preview}\n────────────\nRispondi "${request.id} ok" per inviarlo, oppure "${request.id} prezzo <importo>" per cambiare il prezzo.`,
      );
      return;
    }

    case "add_note": {
      const updated = quoteRepo.appendOwnerNote(request.id, command.note);
      if (updated.status === "pending_owner" && updated.price_eur != null) {
        const preview = quoteMessage(updated, config.business);
        await replyToOwner(
          `Nota aggiunta alla richiesta #${request.id}.\n\nAnteprima aggiornata:\n────────────\n${preview}\n────────────\nRispondi "${request.id} ok" per inviare.`,
        );
      } else {
        await replyToOwner(`Nota aggiunta alla richiesta #${request.id}. ✅`);
      }
      return;
    }

    case "approve": {
      if (request.status !== "pending_owner") {
        await replyToOwner(
          `La richiesta #${request.id} non è in attesa di invio (stato: ${request.status}).`,
        );
        return;
      }
      if (request.price_eur == null) {
        await replyToOwner(
          `Prima imposta il prezzo: "${request.id} prezzo <importo>".`,
        );
        return;
      }
      const body = quoteMessage(request, config.business);
      await provider.sendText(request.customer_phone, body);
      messageRepo.recordOutbound(request.id, body);
      quoteRepo.transition(request.id, "quoted");
      await replyToOwner(
        `Preventivo #${request.id} inviato a ${request.customer_name ?? request.customer_phone}. ✅\nQuando hai novità: "${request.id} vinto" oppure "${request.id} perso".`,
      );
      return;
    }

    case "reject": {
      if (request.status !== "pending_owner" && request.status !== "quoted") {
        await replyToOwner(
          `La richiesta #${request.id} è già chiusa (stato: ${request.status}).`,
        );
        return;
      }
      const body = declineMessage(request, command.reason, config.business);
      await provider.sendText(request.customer_phone, body);
      messageRepo.recordOutbound(request.id, body);
      quoteRepo.transition(request.id, "lost");
      await replyToOwner(`Richiesta #${request.id} declinata e cliente avvisato.`);
      return;
    }

    case "mark_won": {
      quoteRepo.transition(request.id, "won");
      await replyToOwner(`Fantastico! 🎉 Richiesta #${request.id} segnata come vinta.`);
      return;
    }

    case "mark_lost": {
      quoteRepo.transition(request.id, "lost");
      await replyToOwner(`Richiesta #${request.id} segnata come persa.`);
      return;
    }
  }
}
