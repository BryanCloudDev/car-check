import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Car Check',
  description: 'Gestión de talleres mecánicos',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
