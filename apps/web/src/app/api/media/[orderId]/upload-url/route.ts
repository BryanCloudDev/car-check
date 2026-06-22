import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  try {
    const body = await req.json();
    const data = await apiFetch<{ uploadUrl: string; key: string }>(
      `/work-orders/${orderId}/media/upload-url`,
      { method: 'POST', body: JSON.stringify(body) },
    );
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
