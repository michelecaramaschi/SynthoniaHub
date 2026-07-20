import { Layout } from '@/components/Layout/Layout';
import { ProtectedRoute } from '@/components/Common/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card';
import { useCash, useBudget } from '@/lib/hooks/useFinancial';
import { Loading } from '@/components/UI/Loading';
import Button from '@/components/UI/Button';
import { Badge } from '@/components/UI/Badge';
import { formatCurrency } from '@/lib/utils/formatters';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FinancialPage() {
  const { data: cashData, isLoading: cashLoading } = useCash();
  const { data: budgetData, isLoading: budgetLoading } = useBudget();

  // Sample chart data
  const weeklyData = [
    { date: 'Lun', cash: 4500, budget: 3200 },
    { date: 'Mar', cash: 5200, budget: 3500 },
    { date: 'Mer', cash: 4800, budget: 3000 },
    { date: 'Gio', cash: 5500, budget: 3800 },
    { date: 'Ven', cash: 5900, budget: 3600 },
    { date: 'Sab', cash: 6100, budget: 4000 },
    { date: 'Dom', cash: 5000, budget: 2800 },
  ];

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Finanze</h1>
            <p className="text-gray-600">Monitora cash e budget giornalieri</p>
          </div>

          {/* Top Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cash Widget */}
            <Card>
              <CardHeader>
                <CardTitle>💰 Cash Disponibile</CardTitle>
              </CardHeader>
              <CardContent>
                {cashLoading ? (
                  <Loading />
                ) : cashData ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Oggi</p>
                      <p className="text-4xl font-bold text-green-600">{formatCurrency(cashData.totalCash)}</p>
                    </div>
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Scorsa Settimana</span>
                        <span className="font-medium">{formatCurrency(cashData.previousWeekCash)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Variazione</span>
                        <Badge variant={cashData.trend === 'up' ? 'success' : 'danger'}>
                          {cashData.trend === 'up' ? '↑' : '↓'} {cashData.percentageChange}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">Nessun dato disponibile</p>
                )}
              </CardContent>
            </Card>

            {/* Budget Widget */}
            <Card>
              <CardHeader>
                <CardTitle>📊 Budget</CardTitle>
              </CardHeader>
              <CardContent>
                {budgetLoading ? (
                  <Loading />
                ) : budgetData ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Utilizzo</span>
                        <span className="font-bold text-gray-900">{budgetData.percentageUsed}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all"
                          style={{ width: `${Math.min(budgetData.percentageUsed, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-xs text-gray-600">Allocato</p>
                        <p className="font-bold text-gray-900">{formatCurrency(budgetData.budgetAllocated)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Utilizzato</p>
                        <p className="font-bold text-gray-900">{formatCurrency(budgetData.budgetUsed)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Rimanente</p>
                        <p className="font-bold text-green-600">{formatCurrency(budgetData.budgetRemaining)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Previsione</p>
                        <p className="font-bold text-purple-600">{formatCurrency(budgetData.projectedRevenue)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">Nessun dato disponibile</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Card>
            <CardHeader>
              <CardTitle>Trend Settimanale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="cash" stroke="#10b981" fill="#d1fae5" name="Cash" />
                    <Area type="monotone" dataKey="budget" stroke="#3b82f6" fill="#dbeafe" name="Budget" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Daily Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Breakdown Giornaliero</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="cash" fill="#10b981" name="Cash" />
                    <Bar dataKey="budget" fill="#3b82f6" name="Budget" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="primary">
              Aggiungi Dati Finanziari
            </Button>
            <Button variant="secondary">
              Esporta Report
            </Button>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
