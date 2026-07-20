import { useSession } from 'next-auth/react';
import { Layout } from '@/components/Layout/Layout';
import { ProtectedRoute } from '@/components/Common/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { CashWidget } from '@/components/Dashboard/CashWidget';
import { BudgetWidget } from '@/components/Dashboard/BudgetWidget';
import { RequestsMetrics } from '@/components/Dashboard/RequestsMetrics';
import { DayCheckCard } from '@/components/Dashboard/DayCheckCard';
import { FormulaCheckCard } from '@/components/Dashboard/FormulaCheckCard';

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Welcome Section */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Benvenuto, {session?.user?.name}!
            </h1>
            <p className="text-gray-600">
              Gestisci le richieste dei clienti da WhatsApp, monitora le finanze e completa le checklist giornaliere
            </p>
          </div>

          {/* Financial Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CashWidget />
            <BudgetWidget />
          </div>

          {/* Requests and Checklists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <RequestsMetrics />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <DayCheckCard />
              <FormulaCheckCard />
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-600">
                  Questa è la tua dashboard Synthonia. Da qui puoi gestire:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Badge variant="info">📱</Badge>
                    Richieste WhatsApp
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="info">💰</Badge>
                    Dati Finanziari
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="info">✓</Badge>
                    Checklist Giornalieri
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Database</span>
                  <Badge variant="success">Connesso</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">WhatsApp API</span>
                  <Badge variant="warning">In Configurazione</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">WebSocket</span>
                  <Badge variant="warning">In Sviluppo</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
