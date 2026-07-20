import { useState } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { ProtectedRoute } from '@/components/Common/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card';
import { useRequests } from '@/lib/hooks/useRequests';
import { Loading } from '@/components/UI/Loading';
import { Badge } from '@/components/UI/Badge';
import Button from '@/components/UI/Button';
import { REQUEST_STATUS_LABELS, REQUEST_TYPE_LABELS, PRIORITY_LABELS, STATUS_COLORS, PRIORITY_COLORS } from '@/lib/utils/constants';
import { formatDateTime, formatPhoneNumber } from '@/lib/utils/formatters';

export default function RequestsPage() {
  const { data: requests, isLoading } = useRequests({ limit: 100 });
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [filter, setFilter] = useState<string>('');

  const filteredRequests = requests.filter(r =>
    filter === '' || r.status === filter
  );

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Richieste Clienti</h1>
            <p className="text-gray-600">Gestisci e traccia tutte le richieste da WhatsApp</p>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filter === '' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setFilter('')}
                >
                  Tutte ({requests.length})
                </Button>
                <Button
                  variant={filter === 'RECEIVED' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setFilter('RECEIVED')}
                >
                  Ricevuta ({requests.filter(r => r.status === 'RECEIVED').length})
                </Button>
                <Button
                  variant={filter === 'PROCESSING' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setFilter('PROCESSING')}
                >
                  In Lavorazione ({requests.filter(r => r.status === 'PROCESSING').length})
                </Button>
                <Button
                  variant={filter === 'COMPLETED' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setFilter('COMPLETED')}
                >
                  Completata ({requests.filter(r => r.status === 'COMPLETED').length})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Requests List */}
          <Card>
            <CardHeader>
              <CardTitle>Lista Richieste</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loading />
              ) : filteredRequests.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Nessuna richiesta trovata</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Cliente</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Priorità</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map(request => (
                        <tr key={request.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{request.clientName}</p>
                              <p className="text-sm text-gray-600">{formatPhoneNumber(request.clientPhone)}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="info">{REQUEST_TYPE_LABELS[request.requestType] || request.requestType}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={STATUS_COLORS[request.status]}>
                              {REQUEST_STATUS_LABELS[request.status] || request.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={PRIORITY_COLORS[request.priority]}>
                              {PRIORITY_LABELS[request.priority] || request.priority}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {formatDateTime(new Date(request.createdAt))}
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                            >
                              Dettagli
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Request Detail Modal */}
          {selectedRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>Dettagli Richiesta</CardTitle>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="text-2xl text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Cliente</p>
                      <p className="font-medium text-gray-900">{selectedRequest.clientName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Telefono</p>
                      <p className="font-medium text-gray-900">{formatPhoneNumber(selectedRequest.clientPhone)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tipo</p>
                      <p className="font-medium text-gray-900">
                        {REQUEST_TYPE_LABELS[selectedRequest.requestType]}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Priorità</p>
                      <p className="font-medium text-gray-900">
                        {PRIORITY_LABELS[selectedRequest.priority]}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Messaggio</p>
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-900">
                      {selectedRequest.content}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="primary" size="sm">
                      Rispodi
                    </Button>
                    <Button variant="secondary" size="sm">
                      Assegna
                    </Button>
                    <Button variant="ghost" size="sm">
                      Chiudi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
