import type { AppConfig } from "../config.js";
import type {
  MessageRepository,
  QuoteRequestRepository,
} from "../db/repositories.js";
import type { MessagingProvider } from "../whatsapp/provider.js";
import { runCustomerTurn } from "./customer-conversation.js";
import { handleOwnerMessage, notifyOwner } from "./owner-flow.js";
import {
  AI_UNAVAILABLE_MESSAGE,
  UNSUPPORTED_MEDIA_MESSAGE,
} from "./templates.js";

export interface RouterDeps {
  config: AppConfig;
  quoteRepo: QuoteRequestRepository;
  messageRepo: MessageRepository;
  provider: MessagingProvider;
}

export interface InboundEvent {
  from: string; // digits-only phone
  text: string | null; // null for unsupported media types
  waMessageId: string | null; // null in the simulator
  profileName?: string | null;
}

/**
 * Entry point for every inbound message (webhook and simulator both call this).
 * Serializes processing per phone number so rapid messages don't interleave.
 */
export class Router {
  private queues = new Map<string, Promise<void>>();

  constructor(private deps: RouterDeps) {}

  handleInbound(event: InboundEvent): Promise<void> {
    const previous = this.queues.get(event.from) ?? Promise.resolve();
    const next = previous
      .catch(() => {})
      .then(() => this.process(event))
      .finally(() => {
        if (this.queues.get(event.from) === next) this.queues.delete(event.from);
      });
    this.queues.set(event.from, next);
    return next;
  }

  private async process(event: InboundEvent): Promise<void> {
    const { config, quoteRepo, messageRepo, provider } = this.deps;

    if (event.from === config.ownerPhone) {
      const fresh = messageRepo.recordInbound({
        quoteRequestId: null,
        waMessageId: event.waMessageId,
        sender: "owner",
        body: event.text ?? "[messaggio non testuale]",
      });
      if (!fresh || event.text === null) return;
      try {
        await handleOwnerMessage(this.deps, event.text);
      } catch (error) {
        console.error("Owner message handling failed:", error);
        await this.trySend(
          config.ownerPhone,
          "Si è verificato un errore nell'elaborazione del comando. Riprova tra qualche istante.",
        );
      }
      return;
    }

    // Customer message
    const request = quoteRepo.findOrCreateActive(event.from);
    if (event.profileName && !request.customer_name) {
      // Meta profile name as a starting point; the AI overwrites it if the
      // customer introduces themselves differently.
      quoteRepo.patch(request.id, { customer_name: event.profileName });
    }

    const fresh = messageRepo.recordInbound({
      quoteRequestId: request.id,
      waMessageId: event.waMessageId,
      sender: "customer",
      body: event.text ?? "[messaggio non testuale]",
    });
    if (!fresh) return; // webhook retry, already processed

    if (event.text === null) {
      await this.trySend(event.from, UNSUPPORTED_MEDIA_MESSAGE);
      messageRepo.recordOutbound(request.id, UNSUPPORTED_MEDIA_MESSAGE);
      return;
    }

    try {
      const current = quoteRepo.getById(request.id)!;
      const result = await runCustomerTurn({
        config,
        quoteRepo,
        messageRepo,
        request: current,
        text: event.text,
      });

      await provider.sendText(event.from, result.reply);
      messageRepo.recordOutbound(request.id, result.reply);

      if (result.completed && current.status === "collecting_info") {
        const ready = quoteRepo.transition(request.id, "pending_owner");
        await notifyOwner(this.deps, ready, result.summaryForOwner);
      }
    } catch (error) {
      console.error(`Customer turn failed for +${event.from}:`, error);
      await this.trySend(event.from, AI_UNAVAILABLE_MESSAGE);
      messageRepo.recordOutbound(request.id, AI_UNAVAILABLE_MESSAGE);
      await this.trySend(
        config.ownerPhone,
        `⚠️ Non sono riuscito a rispondere automaticamente a +${event.from} (richiesta #${request.id}). Controlla la conversazione appena puoi.`,
      );
    }
  }

  private async trySend(to: string, body: string): Promise<void> {
    try {
      await this.deps.provider.sendText(to, body);
    } catch (error) {
      console.error(`Failed to send message to +${to}:`, error);
    }
  }
}
