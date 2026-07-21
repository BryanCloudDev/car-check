'use client';

import { useState } from 'react';
import { SidebarNav } from '@/components/SidebarNav';
import { LanguageSelector } from '@/components/LanguageSelector';

export function AppShell({
  children,
  logout,
}: {
  children: React.ReactNode;
  logout: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Top bar — solo móvil/tablet */}
      <header className="flex items-center gap-3 border-b border-gray-700 bg-gray-900 px-4 py-3 text-white lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
          className="-ml-1 rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="h-6 w-6"
            aria-hidden
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="text-lg font-bold tracking-tight">Car Check</span>
      </header>

      {/* Backdrop del drawer — solo móvil */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          aria-hidden
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      {/* Sidebar — estático en desktop, drawer deslizable en móvil */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-56 flex-col bg-gray-900 text-white transition-transform duration-200 lg:static lg:z-auto lg:shrink-0 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-700 px-6 py-5">
          <span className="text-lg font-bold tracking-tight">Car Check</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="-mr-1 rounded-lg p-1 text-2xl leading-none text-gray-400 transition-colors hover:bg-gray-800 hover:text-white lg:hidden"
          >
            ×
          </button>
        </div>

        <SidebarNav onNavigate={() => setOpen(false)} />

        <div className="space-y-2 border-t border-gray-700 px-3 py-4">
          <LanguageSelector />
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 bg-gray-50 lg:overflow-auto">{children}</main>
    </div>
  );
}
