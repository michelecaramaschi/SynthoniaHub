import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const requests = await prisma.clientRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return res.status(200).json(requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { clientPhone, clientName, content, requestType, priority } = req.body;

      const request = await prisma.clientRequest.create({
        data: {
          whatsappMessageId: `msg_${Date.now()}`,
          clientPhone,
          clientName,
          content,
          requestType: requestType || 'OTHER',
          priority: priority || 'MEDIUM',
        },
      });

      return res.status(201).json(request);
    } catch (error) {
      console.error('Error creating request:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
