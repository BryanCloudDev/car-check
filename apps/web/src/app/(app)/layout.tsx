import { NextIntlClientProvider } from 'next-intl';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { UserRole } from '@car-check/shared';
import { AppShell } from '@/components/AppShell';
import { getCurrentUser } from '@/lib/auth';

async function logout() {
  'use server';
  const cookieStore = await cookies();
  cookieStore.delete('session');
  redirect('/login');
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let role: UserRole = 'MECANICO';
  try {
    role = (await getCurrentUser()).role;
  } catch {
    // Sesión inválida/expirada: el middleware redirige al login.
    redirect('/login');
  }

  return (
    <NextIntlClientProvider>
      <AppShell logout={logout} role={role}>
        {children}
      </AppShell>
    </NextIntlClientProvider>
  );
}
