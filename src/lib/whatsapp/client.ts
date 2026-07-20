import axios, { AxiosInstance } from 'axios';
import { WhatsAppSendRequest } from '@/types/whatsapp';

const API_VERSION = 'v18.0';
const BASE_URL = 'https://graph.instagram.com';

export class WhatsAppClient {
  private client: AxiosInstance;
  private businessAccountId: string;
  private phoneNumberId: string;
  private accessToken: string;

  constructor(
    businessAccountId: string = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
    phoneNumberId: string = process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    accessToken: string = process.env.WHATSAPP_ACCESS_TOKEN || ''
  ) {
    this.businessAccountId = businessAccountId;
    this.phoneNumberId = phoneNumberId;
    this.accessToken = accessToken;

    this.client = axios.create({
      baseURL: `${BASE_URL}/${API_VERSION}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async sendMessage(to: string, text: string): Promise<{ messageId: string }> {
    try {
      const payload: WhatsAppSendRequest = {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: {
          body: text,
        },
      };

      const response = await this.client.post(
        `/${this.phoneNumberId}/messages`,
        payload
      );

      return {
        messageId: response.data.messages[0].id,
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.client.post(`/${this.phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  async getPhoneNumber(): Promise<string> {
    try {
      const response = await this.client.get(`/${this.phoneNumberId}`);
      return response.data.display_phone_number;
    } catch (error) {
      console.error('Error getting phone number:', error);
      throw error;
    }
  }

  verifyWebhookToken(token: string): boolean {
    const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';
    return token === expectedToken;
  }
}

// Singleton instance
let instance: WhatsAppClient | null = null;

export function getWhatsAppClient(): WhatsAppClient {
  if (!instance) {
    instance = new WhatsAppClient();
  }
  return instance;
}

export default WhatsAppClient;
