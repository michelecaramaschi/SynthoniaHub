import { useBudget } from '@/lib/hooks/useFinancial';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card';
import { Loading } from '@/components/UI/Loading';
import { formatCurrency } from '@/lib/utils/formatters';

export function BudgetWidget() {
  const { data, isLoading } = useBudget();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <Loading />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Nessun dato disponibile</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 Budget</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Allocato vs Utilizzato</span>
            <span className="text-sm font-bold text-gray-900">{data.percentageUsed}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(data.percentageUsed, 100)}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-gray-600">Allocato</p>
            <p className="font-bold text-gray-900">{formatCurrency(data.budgetAllocated)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Utilizzato</p>
            <p className="font-bold text-gray-900">{formatCurrency(data.budgetUsed)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Rimanente</p>
            <p className="font-bold text-green-600">{formatCurrency(data.budgetRemaining)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Previsione</p>
            <p className="font-bold text-purple-600">{formatCurrency(data.projectedRevenue)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
