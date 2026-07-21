import type { Metadata } from 'next';
import { getLocale } from '@/i18n/locale';
import './globals.css';

export const metadata: Metadata = {
  title: 'Car Check',
  description: 'Gestión de talleres mecánicos',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
