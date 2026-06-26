import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { SidebarNav } from '@/components/SidebarNav';

async function logout() {
  'use server';
  const cookieStore = await cookies();
  cookieStore.delete('session');
  redirect('/login');
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-gray-700">
          <span className="text-lg font-bold tracking-tight">Car Check</span>
        </div>

        <SidebarNav />

        <div className="px-3 py-4 border-t border-gray-700">
          <form action={logout}>
            <button
              type="submit"
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 overflow-auto">{children}</main>
    </div>
  );
}
