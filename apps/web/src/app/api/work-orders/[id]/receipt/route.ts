import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = (await cookies()).get('session')?.value;

  const res = await fetch(
    `${API_URL}/api/work-orders/${encodeURIComponent(id)}/receipt.pdf`,
    {
      cache: 'no-store',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: `No se pudo generar el comprobante (HTTP ${res.status}).` },
      { status: res.status },
    );
  }

  return new NextResponse(res.body, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="orden-${id.slice(0, 8)}.pdf"`,
    },
  });
}
