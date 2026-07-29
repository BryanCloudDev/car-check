'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import type { WorkshopProfile } from '@car-check/shared';
import { ApiError, apiFetch } from '@/lib/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type WorkshopFormState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string>;
};

type Payload = {
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  nit: string | null;
};

/** Vacío significa "limpiar el campo", que el backend recibe como null. */
function optional(formData: FormData, field: string): string | null {
  const value = String(formData.get(field) ?? '').trim();
  return value.length > 0 ? value : null;
}

function parseFields(
  formData: FormData,
  t: (key: string) => string,
): { values: Payload; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const name = String(formData.get('name') ?? '').trim();
  if (name.length < 2) {
    errors.name = t('nameMin');
  }

  const email = String(formData.get('email') ?? '').trim();
  if (!EMAIL_REGEX.test(email)) {
    errors.email = t('emailInvalid');
  }

  const phone = optional(formData, 'phone');
  if (phone && phone.length < 7) {
    errors.phone = t('phoneMin');
  }

  return {
    values: {
      name,
      email,
      phone,
      address: optional(formData, 'address'),
      nit: optional(formData, 'nit'),
    },
    errors,
  };
}

export async function updateWorkshopAction(
  _prev: WorkshopFormState,
  formData: FormData,
): Promise<WorkshopFormState> {
  const t = await getTranslations('configuracion.errors');
  const { values, errors } = parseFields(formData, t);
  if (Object.keys(errors).length > 0) {
    return { fieldErrors: errors };
  }

  try {
    await apiFetch<WorkshopProfile>('/workshops/me', {
      method: 'PATCH',
      body: JSON.stringify(values),
    });
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 409) return { error: t('emailTaken') };
      if (err.status === 403) return { error: t('forbidden') };
      if (err.status === 400) {
        return { error: err.firstMessage ?? t('invalidData') };
      }
    }
    return { error: t('updateFailed') };
  }

  // El nombre y el logo del taller se muestran en toda la app.
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function removeLogoAction(): Promise<{ error?: string }> {
  const t = await getTranslations('configuracion.errors');
  try {
    await apiFetch<WorkshopProfile>('/workshops/me/logo', {
      method: 'DELETE',
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) {
      return { error: t('forbidden') };
    }
    return { error: t('logoRemoveFailed') };
  }

  revalidatePath('/', 'layout');
  return {};
}
