import { useRequests } from '@/lib/hooks/useRequests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card';
import { Loading } from '@/components/UI/Loading';
import { REQUEST_STATUS_LABELS } from '@/lib/utils/constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = {
  RECEIVED: '#3b82f6',
  PROCESSING: '#f59e0b',
  COMPLETED: '#10b981',
  ARCHIVED: '#9ca3af',
};

export function RequestsMetrics() {
  const { data: requests, isLoading } = useRequests();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📱 Metriche Richieste</CardTitle>
        </CardHeader>
        <CardContent>
          <Loading />
        </CardContent>
      </Card>
    );
  }

  // Calculate metrics
  const total = requests.length;
  const byStatus = {
    RECEIVED: requests.filter(r => r.status === 'RECEIVED').length,
    PROCESSING: requests.filter(r => r.status === 'PROCESSING').length,
    COMPLETED: requests.filter(r => r.status === 'COMPLETED').length,
    ARCHIVED: requests.filter(r => r.status === 'ARCHIVED').length,
  };

  const chartData = Object.entries(byStatus).map(([status, count]) => ({
    name: REQUEST_STATUS_LABELS[status] || status,
    value: count,
    color: COLORS[status as keyof typeof COLORS],
  }));

  const completionRate = total > 0 ? Math.round((byStatus.COMPLETED / total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>📱 Metriche Richieste</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Totale</p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">In Lavorazione</p>
            <p className="text-2xl font-bold text-yellow-600">{byStatus.PROCESSING}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Completamento</p>
            <p className="text-2xl font-bold text-green-600">{completionRate}%</p>
          </div>
        </div>

        {/* Pie Chart */}
        {total > 0 && (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
