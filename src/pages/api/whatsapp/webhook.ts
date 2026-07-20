import type { NextApiRequest, NextApiResponse } from 'next';
import { getWhatsAppClient } from '@/lib/whatsapp/client';
import { parseMessage, extractPhoneNumber } from '@/lib/whatsapp/messageParser';
import { prisma } from '@/lib/db/client';
import { WhatsAppWebhookPayload } from '@/types/whatsapp';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle webhook verification (GET request)
  if (req.method === 'GET') {
    const verifyToken = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const client = getWhatsAppClient();
    if (client.verifyWebhookToken(verifyToken as string)) {
      return res.status(200).send(challenge);
    }

    return res.status(403).json({ error: 'Invalid verify token' });
  }

  // Handle incoming messages (POST request)
  if (req.method === 'POST') {
    try {
      const payload: WhatsAppWebhookPayload = req.body;

      // Log the webhook for audit
      await prisma.whatsAppWebhookLog.create({
        data: {
          webhookType: 'MESSAGE',
          payload: payload as any,
          processed: false,
        },
      });

      // Process the webhook
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages' && change.value.messages) {
            for (const message of change.value.messages) {
              await handleIncomingMessage(
                message,
                change.value.contacts?.[0],
                change.value.metadata
              );
            }
          }
          // Handle message status updates
          if (change.field === 'messages' && change.value.statuses) {
            for (const status of change.value.statuses) {
              await handleMessageStatus(status.id, status.status);
            }
          }
        }
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error processing webhook:', error);

      // Log error to webhook logs
      try {
        await prisma.whatsAppWebhookLog.create({
          data: {
            webhookType: 'ERROR',
            payload: req.body as any,
            processed: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      } catch (logError) {
        console.error('Error logging webhook error:', logError);
      }

      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

async function handleIncomingMessage(
  message: any,
  contact: any,
  metadata: any
) {
  const clientPhone = extractPhoneNumber(message.from);
  const clientName = contact?.profile?.name || 'Unknown';
  const messageText = message.text?.body || '';
  const messageId = message.id;

  if (!messageText) {
    console.log('Message has no text content, skipping');
    return;
  }

  // Parse message to determine type and priority
  const { type, priority, keywords } = parseMessage(messageText);

  // Check if message already exists
  const existing = await prisma.clientRequest.findUnique({
    where: { whatsappMessageId: messageId },
  });

  if (existing) {
    console.log('Message already processed:', messageId);
    return;
  }

  // Create the request
  const request = await prisma.clientRequest.create({
    data: {
      whatsappMessageId: messageId,
      clientPhone,
      clientName,
      content: messageText,
      requestType: type,
      priority,
      extractedData: {
        keywords,
        receivedAt: new Date().toISOString(),
        whatsappPhone: metadata?.display_phone_number,
      },
      status: 'RECEIVED',
    },
  });

  // Create timeline event
  await prisma.requestTimeline.create({
    data: {
      requestId: request.id,
      eventType: 'RECEIVED',
      details: {
        source: 'whatsapp',
        autoDetectedType: type,
        confidence: `${(parseMessage(messageText).confidence * 100).toFixed(0)}%`,
      },
      createdByUserId: 'system', // Will need a system user
    },
  });

  console.log('Created request:', request.id);
}

async function handleMessageStatus(messageId: string, status: string) {
  // Update request status based on WhatsApp message status
  // status can be: 'sent', 'delivered', 'read', 'failed'

  const request = await prisma.clientRequest.findUnique({
    where: { whatsappMessageId: messageId },
  });

  if (!request) {
    console.log('Request not found for message:', messageId);
    return;
  }

  if (status === 'read') {
    await prisma.requestTimeline.create({
      data: {
        requestId: request.id,
        eventType: 'VIEWED',
        createdByUserId: 'system',
      },
    });
  }

  console.log('Updated message status:', messageId, status);
}
