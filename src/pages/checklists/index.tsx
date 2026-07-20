import { useState } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { ProtectedRoute } from '@/components/Common/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card';
import { useDailyChecklist, useFormulaChecks } from '@/lib/hooks/useChecklists';
import { Loading } from '@/components/UI/Loading';
import Button from '@/components/UI/Button';
import { Badge } from '@/components/UI/Badge';
import { formatDate } from '@/lib/utils/formatters';

export default function ChecklistsPage() {
  const { data: dailyChecklist, isLoading: dailyLoading } = useDailyChecklist();
  const { data: formulaChecks, isLoading: formulasLoading } = useFormulaChecks();
  const [activeTab, setActiveTab] = useState<'daily' | 'formula'>('daily');

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Checklist</h1>
            <p className="text-gray-600">Gestisci il Day Check e le Formula Check</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-4 py-2 border-b-2 font-medium ${
                activeTab === 'daily'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Day Check
            </button>
            <button
              onClick={() => setActiveTab('formula')}
              className={`px-4 py-2 border-b-2 font-medium ${
                activeTab === 'formula'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Formula Check
            </button>
          </div>

          {/* Daily Checklist Tab */}
          {activeTab === 'daily' && (
            <Card>
              <CardHeader>
                <CardTitle>Day Check - {dailyChecklist ? formatDate(new Date(dailyChecklist.date)) : 'Oggi'}</CardTitle>
              </CardHeader>
              <CardContent>
                {dailyLoading ? (
                  <Loading />
                ) : !dailyChecklist ? (
                  <p className="text-gray-600">Nessuna checklist per oggi</p>
                ) : (
                  <div className="space-y-4">
                    {/* Progress */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-gray-700">Progresso</span>
                        <span className="text-sm text-gray-600">
                          {dailyChecklist.items.filter((i: any) => i.completed).length} / {dailyChecklist.items.length}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-600 h-3 rounded-full transition-all"
                          style={{
                            width: `${(dailyChecklist.items.filter((i: any) => i.completed).length / dailyChecklist.items.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-3 pt-4">
                      {dailyChecklist.items.map((item: any) => (
                        <label key={item.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => {}}
                            className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                          />
                          <span className={item.completed ? 'text-gray-400 line-through' : 'text-gray-900'}>
                            {item.text}
                          </span>
                        </label>
                      ))}
                    </div>

                    {/* Status Badge */}
                    <div className="pt-4 border-t">
                      <Badge variant={dailyChecklist.status === 'COMPLETED' ? 'success' : 'warning'}>
                        {dailyChecklist.status === 'COMPLETED' ? 'Completata' : 'In Lavorazione'}
                      </Badge>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                      <Button variant="primary" size="sm">
                        Salva Modifiche
                      </Button>
                      <Button variant="secondary" size="sm">
                        Segna come Completata
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Formula Checks Tab */}
          {activeTab === 'formula' && (
            <div className="space-y-4">
              {formulasLoading ? (
                <Card>
                  <CardContent className="pt-6">
                    <Loading />
                  </CardContent>
                </Card>
              ) : !formulaChecks || formulaChecks.length === 0 ? (
                <Card>
                  <CardContent className="py-8">
                    <p className="text-gray-600 text-center">Nessuna formula check disponibile</p>
                  </CardContent>
                </Card>
              ) : (
                formulaChecks.map(check => (
                  <Card key={check.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{check.name}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">{check.description}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={check.isActive ? 'success' : 'warning'}>
                            {check.isActive ? 'Attiva' : 'Disattiva'}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-2">{check.frequency}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        {check.checkItems.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full" />
                            <span className="text-gray-900">{item.text}</span>
                            {item.required && (
                              <Badge variant="warning">Richiesto</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button variant="primary" size="sm">
                        Completa Check
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
