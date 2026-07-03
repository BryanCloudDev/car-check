import { NextRequest, NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';
import type { MediaAsset } from '@car-check/shared';

export type MediaAssetWithUrl = MediaAsset & { url: string };

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  try {
    const data = await apiFetch<MediaAssetWithUrl[]>(
      `/work-orders/${orderId}/media`,
    );
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
