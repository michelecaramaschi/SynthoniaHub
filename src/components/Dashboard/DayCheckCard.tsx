import { useDailyChecklist } from '@/lib/hooks/useChecklists';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card';
import { Loading } from '@/components/UI/Loading';
import { Badge } from '@/components/UI/Badge';
import Button from '@/components/UI/Button';

export function DayCheckCard() {
  const { data: checklist, isLoading } = useDailyChecklist();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>✓ Day Check</CardTitle>
        </CardHeader>
        <CardContent>
          <Loading />
        </CardContent>
      </Card>
    );
  }

  if (!checklist) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>✓ Day Check</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">Nessuna checklist per oggi</p>
          <Button variant="primary" size="sm">Crea Checklist</Button>
        </CardContent>
      </Card>
    );
  }

  const completed = checklist.items.filter((item: any) => item.completed).length;
  const total = checklist.items.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>✓ Day Check</span>
          <Badge variant={percentage === 100 ? 'success' : percentage > 50 ? 'warning' : 'default'}>
            {completed}/{total}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">Progresso</span>
            <span className="text-sm font-bold text-gray-900">{percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Checklist Items */}
        <div className="space-y-2">
          {checklist.items.slice(0, 4).map((item: any) => (
            <div key={item.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.completed}
                className="w-4 h-4"
                readOnly
              />
              <span className={item.completed ? 'text-gray-400 line-through' : 'text-gray-700'}>
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {total > 4 && (
          <p className="text-sm text-gray-600">+{total - 4} altri elementi</p>
        )}

        <Button variant="secondary" size="sm" className="w-full">
          Visualizza Tutti
        </Button>
      </CardContent>
    </Card>
  );
}
