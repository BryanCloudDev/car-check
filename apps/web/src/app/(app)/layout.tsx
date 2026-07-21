import { NextIntlClientProvider } from 'next-intl';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AppShell } from '@/components/AppShell';

async function logout() {
  'use server';
  const cookieStore = await cookies();
  cookieStore.delete('session');
  redirect('/login');
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider>
      <AppShell logout={logout}>{children}</AppShell>
    </NextIntlClientProvider>
  );
}
