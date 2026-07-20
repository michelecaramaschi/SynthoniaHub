import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push('/');
      }
    } catch (err) {
      setError('Si è verificato un errore. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Synthonia Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="user@synthonia.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            {error && (
              <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm">{error}</div>
            )}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              Accedi
            </Button>
            <p className="text-sm text-gray-600 text-center">
              Test: admin@synthonia.com / password123
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
