import { cookies } from 'next/headers';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly statusText: string,
  ) {
    super(`API ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    throw new ApiError(res.status, res.statusText);
  }

  return res.json() as Promise<T>;
}
