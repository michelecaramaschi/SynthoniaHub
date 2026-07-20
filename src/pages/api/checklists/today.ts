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

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let checklist = await prisma.dailyChecklist.findUnique({
      where: { date: today },
    });

    // If no checklist exists for today, create a default one
    if (!checklist) {
      checklist = await prisma.dailyChecklist.create({
        data: {
          date: today,
          createdById: (session.user as any).id,
          items: [
            { id: '1', text: 'Controllare messaggi WhatsApp', completed: false },
            { id: '2', text: 'Processare nuove richieste', completed: false },
            { id: '3', text: 'Preparare report giornaliero', completed: false },
            { id: '4', text: 'Contattare clienti follow-up', completed: false },
          ],
          status: 'PENDING',
        },
      });
    }

    return res.status(200).json(checklist);
  } catch (error) {
    console.error('Error fetching daily checklist:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
