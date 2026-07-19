import type { MessagingProvider } from "../whatsapp/provider.js";

/** Prints outbound messages to stdout instead of sending them to WhatsApp. */
export class ConsoleProvider implements MessagingProvider {
  constructor(private ownerPhone: string) {}

  async sendText(to: string, body: string): Promise<void> {
    const recipient =
      to === this.ownerPhone ? "OWNER (titolare)" : `CUSTOMER +${to}`;
    const line = "─".repeat(46);
    console.log(`\n┌─ to ${recipient} ${line.slice(recipient.length + 6)}`);
    for (const row of body.split("\n")) {
      console.log(`│ ${row}`);
    }
    console.log(`└${line}`);
  }
}
