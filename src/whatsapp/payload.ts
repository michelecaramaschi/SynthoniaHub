/** Normalized inbound message, independent of the Meta webhook JSON shape. */
export interface InboundMessage {
  from: string; // sender phone, digits only
  text: string | null; // null for non-text messages (audio, image, ...)
  waMessageId: string;
  timestamp: number;
  profileName: string | null;
}

interface MetaWebhookBody {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      field?: string;
      value?: {
        messages?: Array<{
          id?: string;
          from?: string;
          timestamp?: string;
          type?: string;
          text?: { body?: string };
        }>;
        contacts?: Array<{
          wa_id?: string;
          profile?: { name?: string };
        }>;
      };
    }>;
  }>;
}

/**
 * Extracts inbound messages from a Meta webhook payload.
 * Status updates (delivered/read receipts) produce no entries.
 */
export function parseWebhookPayload(body: unknown): InboundMessage[] {
  const payload = body as MetaWebhookBody;
  const result: InboundMessage[] = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field && change.field !== "messages") continue;
      const value = change.value;
      const names = new Map<string, string>();
      for (const contact of value?.contacts ?? []) {
        if (contact.wa_id && contact.profile?.name) {
          names.set(contact.wa_id, contact.profile.name);
        }
      }
      for (const message of value?.messages ?? []) {
        if (!message.id || !message.from) continue;
        result.push({
          from: message.from.replace(/[^0-9]/g, ""),
          text: message.type === "text" ? (message.text?.body ?? null) : null,
          waMessageId: message.id,
          timestamp: Number(message.timestamp ?? 0),
          profileName: names.get(message.from) ?? null,
        });
      }
    }
  }
  return result;
}
