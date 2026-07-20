import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/client';
import { BudgetMetrics } from '@/types/financial';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BudgetMetrics | { error: string }>
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

    const data = await prisma.financialData.findUnique({
      where: { date: today },
    });

    const budgetAllocated = data?.budgetAllocated || 0;
    const budgetUsed = data?.budgetUsed || 0;
    const budgetRemaining = budgetAllocated - budgetUsed;
    const percentageUsed = budgetAllocated > 0 ? Math.round((budgetUsed / budgetAllocated) * 100) : 0;
    const projectedRevenue = data?.projectedRevenue || 0;

    const metrics: BudgetMetrics = {
      budgetAllocated,
      budgetUsed,
      budgetRemaining,
      percentageUsed,
      projectedRevenue,
    };

    return res.status(200).json(metrics);
  } catch (error) {
    console.error('Error fetching budget data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
