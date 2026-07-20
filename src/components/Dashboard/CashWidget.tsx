import { useCash } from '@/lib/hooks/useFinancial';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card';
import { Loading } from '@/components/UI/Loading';
import { Badge } from '@/components/UI/Badge';
import { formatCurrency } from '@/lib/utils/formatters';

export function CashWidget() {
  const { data, isLoading } = useCash();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>💰 Cash Disponibile</CardTitle>
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
          <CardTitle>💰 Cash Disponibile</CardTitle>
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
        <CardTitle className="flex items-center justify-between">
          <span>💰 Cash Disponibile</span>
          <Badge variant={data.trend === 'up' ? 'success' : data.trend === 'down' ? 'danger' : 'warning'}>
            {data.trend === 'up' ? '↑' : data.trend === 'down' ? '↓' : '→'} {Math.abs(data.percentageChange)}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Oggi</p>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(data.totalCash)}</p>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">Scorsa settimana</p>
            <p className="text-lg text-gray-900">{formatCurrency(data.previousWeekCash)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
