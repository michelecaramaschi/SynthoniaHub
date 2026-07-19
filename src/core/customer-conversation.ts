import Anthropic from "@anthropic-ai/sdk";
import type { BetaMessageParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import type { AppConfig } from "../config.js";
import type {
  MessageRepository,
  QuoteRequest,
  QuoteRequestRepository,
} from "../db/repositories.js";
import { createCustomerTools } from "../ai/tools.js";
import { buildCustomerSystemPrompt } from "../ai/system-prompt.js";
import { getAnthropicClient } from "../ai/client.js";

export interface CustomerTurnResult {
  reply: string;
  /** True when info collection completed during this turn. */
  completed: boolean;
  summaryForOwner: string | undefined;
}

/**
 * Runs one AI conversation turn for a customer message.
 * The tools write extracted fields to the DB as a side effect.
 */
export async function runCustomerTurn(params: {
  config: AppConfig;
  quoteRepo: QuoteRequestRepository;
  messageRepo: MessageRepository;
  request: QuoteRequest;
  text: string;
  now?: Date;
}): Promise<CustomerTurnResult> {
  const { config, quoteRepo, messageRepo, request, text } = params;
  const client = getAnthropicClient();
  const customerTools = createCustomerTools(quoteRepo, request.id);

  const history: BetaMessageParam[] = messageRepo
    .historyForRequest(request.id)
    .map((m) => ({
      role: m.sender === "customer" ? ("user" as const) : ("assistant" as const),
      content: m.body,
    }));

  // Volatile context goes in the last user turn, not in the (cached) system prompt.
  const now = params.now ?? new Date();
  const contextBlock = [
    "<context>",
    `Data e ora attuali: ${now.toLocaleDateString("it-IT", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} (${now.toISOString().slice(0, 10)})`,
    `Stato richiesta #${request.id}: ${request.status}`,
    `Dati già raccolti: ${JSON.stringify(knownFields(request))}`,
    "</context>",
  ].join("\n");

  const runner = client.beta.messages.toolRunner({
    model: config.anthropicModel,
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    system: [
      {
        type: "text",
        text: buildCustomerSystemPrompt(config.business),
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: customerTools.tools,
    messages: [
      ...history,
      { role: "user", content: `${contextBlock}\n\n${text}` },
    ],
    max_iterations: 6,
  });

  const finalMessage = await runner.runUntilDone();
  const reply = finalMessage.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  return {
    reply: reply || "Grazie del messaggio! Ti rispondo subito. 🎶",
    completed: customerTools.isComplete(),
    summaryForOwner: customerTools.summaryForOwner(),
  };
}

function knownFields(request: QuoteRequest): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  const keys = [
    "customer_name",
    "event_type",
    "event_date",
    "event_date_raw",
    "location",
    "guest_count",
    "services",
    "duration_hours",
    "special_requests",
  ] as const;
  for (const key of keys) {
    const value = request[key];
    if (value !== null && value !== undefined) fields[key] = value;
  }
  return fields;
}

export function isAnthropicOverloaded(error: unknown): boolean {
  return (
    error instanceof Anthropic.APIError &&
    (error.status === 429 || (error.status !== undefined && error.status >= 500))
  );
}
