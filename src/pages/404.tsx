import Link from 'next/link';
import Button from '@/components/UI/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Pagina non trovata</h2>
        <p className="text-gray-600 mb-8">La pagina che stai cercando non esiste.</p>
        <Link href="/">
          <Button variant="primary">Torna alla Home</Button>
        </Link>
      </div>
    </div>
  );
}
