import { cookies } from 'next/headers';

import { getLocale } from '@/i18n/locale';

const API_URL = `${process.env.API_URL ?? 'http://localhost:3001'}/api`;

type ApiErrorBody = {
  statusCode?: number;
  error?: string;
  message?: string | string[];
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly statusText: string,
    readonly body?: ApiErrorBody,
  ) {
    super(`API ${status}: ${statusText}`);
    this.name = 'ApiError';
  }

  get messages(): string[] {
    const message = this.body?.message;
    if (Array.isArray(message)) return message;
    if (typeof message === 'string') return [message];
    return [];
  }

  get firstMessage(): string | undefined {
    return this.messages[0];
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  const locale = await getLocale();

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': locale,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => undefined)) as
      | ApiErrorBody
      | undefined;
    throw new ApiError(res.status, res.statusText, body);
  }

  return res.json() as Promise<T>;
}
