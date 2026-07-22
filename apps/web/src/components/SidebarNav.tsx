'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

const navLinks = [
  { href: '/', key: 'inicio' },
  { href: '/vehiculos', key: 'vehiculos' },
  { href: '/historial', key: 'historial' },
  { href: '/clientes', key: 'clientes' },
  { href: '/ordenes', key: 'ordenes' },
] as const;

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navLinks.map(({ href, key }) => {
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
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
