/** Outbound messaging abstraction: the core never knows if WhatsApp is real. */
export interface MessagingProvider {
  sendText(to: string, body: string): Promise<void>;
}
