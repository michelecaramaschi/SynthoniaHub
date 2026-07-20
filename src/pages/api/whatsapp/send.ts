import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { getWhatsAppClient } from '@/lib/whatsapp/client';
import { prisma } from '@/lib/db/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { to, text, requestId } = req.body;

    if (!to || !text) {
      return res.status(400).json({ error: 'Missing required fields: to, text' });
    }

    const client = getWhatsAppClient();

    // Send message via WhatsApp
    const result = await client.sendMessage(to, text);

    // If requestId provided, log the message
    if (requestId) {
      const request = await prisma.clientRequest.findUnique({
        where: { id: requestId },
      });

      if (request) {
        await prisma.requestTimeline.create({
          data: {
            requestId,
            eventType: 'COMMENTED',
            details: {
              messageId: result.messageId,
              sentText: text,
              sentBy: session.user?.email,
            },
            createdByUserId: (session.user as any).id,
          },
        });
      }
    }

    return res.status(200).json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return res.status(500).json({
      error: 'Failed to send message',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
