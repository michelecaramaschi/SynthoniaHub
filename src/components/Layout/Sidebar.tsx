import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'next-auth/react';
import clsx from 'clsx';

interface SidebarLink {
  href: string;
  label: string;
  icon: string;
}

const links: SidebarLink[] = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/requests', label: 'Richieste', icon: '📱' },
  { href: '/checklists', label: 'Checklist', icon: '✓' },
  { href: '/financial', label: 'Finanze', icon: '💰' },
];

export function Sidebar() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold">Synthonia</h1>
        <p className="text-sm text-gray-400">Dashboard</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
              router.pathname === link.href
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            )}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
