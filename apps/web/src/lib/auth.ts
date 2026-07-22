import { cache } from 'react';
import type { UserRole } from '@car-check/shared';
import { apiFetch } from '@/lib/api';

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  workshopId: string;
};

export const getCurrentUser = cache(
  (): Promise<CurrentUser> => apiFetch<CurrentUser>('/auth/me'),
);
