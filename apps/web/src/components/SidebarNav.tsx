'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { UserRole } from '@car-check/shared';

const navLinks = [
  { href: '/', key: 'inicio', adminOnly: true },
  { href: '/vehiculos', key: 'vehiculos', adminOnly: false },
  { href: '/historial', key: 'historial', adminOnly: false },
  { href: '/clientes', key: 'clientes', adminOnly: false },
  { href: '/ordenes', key: 'ordenes', adminOnly: false },
  { href: '/configuracion', key: 'configuracion', adminOnly: true },
] as const;

export function SidebarNav({
  role,
  onNavigate,
}: {
  role: UserRole;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const links =
    role === 'ADMIN' ? navLinks : navLinks.filter((l) => !l.adminOnly);

  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {links.map(({ href, key }) => {
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
