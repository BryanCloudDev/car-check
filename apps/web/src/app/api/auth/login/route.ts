import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Cuerpo inválido' }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      { message: 'No se pudo conectar con el servidor' },
      { status: 503 },
    );
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'Credenciales incorrectas' }));
    return NextResponse.json(data, { status: res.status });
  }

  const data = (await res.json()) as { accessToken: string };
  const cookieStore = await cookies();

  cookieStore.set('session', data.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 h — ajustar al maxAge del JWT en el backend
  });

  return NextResponse.json({ ok: true });
}
