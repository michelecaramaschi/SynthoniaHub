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
    const checks = await prisma.formulaCheck.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json(checks);
  } catch (error) {
    console.error('Error fetching formula checks:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
