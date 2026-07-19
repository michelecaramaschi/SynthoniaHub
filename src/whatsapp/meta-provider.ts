import type { MessagingProvider } from "./provider.js";

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

/** Sends messages through the Meta WhatsApp Cloud API. */
export class MetaProvider implements MessagingProvider {
  constructor(
    private token: string,
    private phoneNumberId: string,
  ) {}

  async sendText(to: string, body: string): Promise<void> {
    const response = await fetch(
      `${GRAPH_API_BASE}/${this.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body },
        }),
      },
    );
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `WhatsApp send failed (${response.status} ${response.statusText}): ${detail}`,
      );
    }
  }
}
