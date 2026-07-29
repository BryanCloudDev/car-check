import { NextRequest, NextResponse } from 'next/server';
import type { WorkshopProfile } from '@car-check/shared';
import { ApiError, apiFetch } from '@/lib/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await apiFetch<WorkshopProfile>('/workshops/me/logo/confirm', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.firstMessage ?? error.statusText },
        { status: error.status },
      );
    }
    const message =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
