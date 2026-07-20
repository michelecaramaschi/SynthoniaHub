import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/client';
import { CashMetrics } from '@/types/financial';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CashMetrics | { error: string }>
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

    const todayData = await prisma.financialData.findUnique({
      where: { date: today },
    });

    // Calculate previous week date
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const previousWeekData = await prisma.financialData.findUnique({
      where: { date: weekAgo },
    });

    const totalCash = todayData?.totalCash || 0;
    const previousWeekCash = previousWeekData?.totalCash || totalCash;

    const difference = totalCash - previousWeekCash;
    const percentageChange = previousWeekCash > 0 ? Math.round((difference / previousWeekCash) * 100) : 0;

    const metrics: CashMetrics = {
      totalCash,
      previousWeekCash,
      trend: difference > 0 ? 'up' : difference < 0 ? 'down' : 'stable',
      percentageChange: Math.abs(percentageChange),
    };

    return res.status(200).json(metrics);
  } catch (error) {
    console.error('Error fetching cash data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
