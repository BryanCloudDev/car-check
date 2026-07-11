import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Car Check — Gestión inteligente para talleres mecánicos',
  description:
    'Historial completo por VIN, órdenes de trabajo, clientes y fotos del servicio. Todo tu taller en una sola plataforma.',
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
