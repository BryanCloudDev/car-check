'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/vehiculos', label: 'Vehículos' },
  { href: '/historial', label: 'Historial' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/ordenes', label: 'Órdenes' },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navLinks.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
              active
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
