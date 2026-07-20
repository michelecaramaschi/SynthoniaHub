import { useSession } from 'next-auth/react';
import { ROLE_LABELS } from '@/lib/utils/constants';

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-600">Benvenuto nel sistema di gestione Synthonia</p>
      </div>

      <div className="flex items-center gap-4">
        {session?.user && (
          <div className="text-right">
            <p className="font-medium text-gray-900">{session.user.name}</p>
            <p className="text-sm text-gray-600">
              {ROLE_LABELS[(session.user as any).role] || 'Utente'}
            </p>
          </div>
        )}
        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
          {session?.user?.name?.charAt(0) || 'U'}
        </div>
      </div>
    </header>
  );
}
