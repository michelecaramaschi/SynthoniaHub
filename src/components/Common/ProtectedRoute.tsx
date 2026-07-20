import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Loading } from '@/components/UI/Loading';
import { Role } from '@prisma/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role[];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  if (requiredRole && !requiredRole.includes((session.user as any).role)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accesso Negato</h1>
          <p className="text-gray-600">Non hai i permessi necessari per accedere a questa pagina</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
