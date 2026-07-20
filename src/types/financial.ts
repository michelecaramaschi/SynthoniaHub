export interface FinancialData {
  id: string;
  date: Date;
  totalCash: number;
  budgetAllocated: number;
  budgetUsed: number;
  projectedRevenue: number;
  notes?: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CashMetrics {
  totalCash: number;
  previousWeekCash: number;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
}

export interface BudgetMetrics {
  budgetAllocated: number;
  budgetUsed: number;
  budgetRemaining: number;
  percentageUsed: number;
  projectedRevenue: number;
}
