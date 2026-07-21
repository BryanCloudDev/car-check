'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ApiError, apiFetch } from '@/lib/api';
import type { Customer } from '@car-check/shared';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CustomerFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

type ParsedFields = {
  values: { name: string; phone: string; email?: string };
  errors: Record<string, string>;
};

function parseFields(
  formData: FormData,
  t: (key: string) => string,
): ParsedFields {
  const errors: Record<string, string> = {};

  const name = String(formData.get('name') ?? '').trim();
  if (name.length < 2) {
    errors.name = t('nameMin');
  }

  const phone = String(formData.get('phone') ?? '').trim();
  if (phone.length < 7) {
    errors.phone = t('phoneMin');
  }

  const email = String(formData.get('email') ?? '').trim();
  if (email && !EMAIL_REGEX.test(email)) {
    errors.email = t('emailInvalid');
  }

  const values: ParsedFields['values'] = { name, phone };
  if (email) values.email = email;

  return { values, errors };
}

export async function createCustomerAction(
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const t = await getTranslations('clientes.errors');
  const { values, errors } = parseFields(formData, t);
  if (Object.keys(errors).length > 0) {
    return { fieldErrors: errors };
  }

  try {
    await apiFetch<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(values),
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 400) {
      return {
        error: err.firstMessage ?? t('invalidData'),
      };
    }
    return { error: t('createFailed') };
  }

  revalidatePath('/clientes');
  redirect('/clientes');
}

export async function updateCustomerAction(
  id: string,
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const t = await getTranslations('clientes.errors');
  const { values, errors } = parseFields(formData, t);
  if (Object.keys(errors).length > 0) {
    return { fieldErrors: errors };
  }

  const payload = { ...values, email: values.email ?? null };

  try {
    await apiFetch<Customer>(`/customers/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return { error: t('notFound') };
    }
    if (err instanceof ApiError && err.status === 400) {
      return {
        error: err.firstMessage ?? t('invalidData'),
      };
    }
    return { error: t('updateFailed') };
  }

  revalidatePath('/clientes');
  revalidatePath(`/clientes/${encodeURIComponent(id)}/editar`);
  redirect('/clientes');
}
