import { useFormulaChecks } from '@/lib/hooks/useChecklists';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card';
import { Loading } from '@/components/UI/Loading';
import Button from '@/components/UI/Button';

export function FormulaCheckCard() {
  const { data: checks, isLoading } = useFormulaChecks();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📋 Formula Check</CardTitle>
        </CardHeader>
        <CardContent>
          <Loading />
        </CardContent>
      </Card>
    );
  }

  if (!checks || checks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📋 Formula Check</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">Nessuna formula check disponibile</p>
          <Button variant="primary" size="sm">Crea Formula</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📋 Formula Check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {checks.slice(0, 3).map(check => (
          <div key={check.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{check.name}</p>
                <p className="text-sm text-gray-600">
                  {check.checkItems.length} step - {check.frequency}
                </p>
              </div>
              <Button variant="ghost" size="sm">
                Completa
              </Button>
            </div>
          </div>
        ))}
        {checks.length > 3 && (
          <p className="text-sm text-gray-600 text-center">
            +{checks.length - 3} altre formule
          </p>
        )}
      </CardContent>
    </Card>
  );
}
