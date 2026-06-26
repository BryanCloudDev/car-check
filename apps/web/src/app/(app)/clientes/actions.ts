'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
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

function parseFields(formData: FormData): ParsedFields {
  const errors: Record<string, string> = {};

  const name = String(formData.get('name') ?? '').trim();
  if (name.length < 2) {
    errors.name = 'El nombre debe tener al menos 2 caracteres.';
  }

  const phone = String(formData.get('phone') ?? '').trim();
  if (phone.length < 7) {
    errors.phone = 'El teléfono debe tener al menos 7 caracteres.';
  }

  const email = String(formData.get('email') ?? '').trim();
  if (email && !EMAIL_REGEX.test(email)) {
    errors.email = 'Ingresá un correo electrónico válido.';
  }

  const values: ParsedFields['values'] = { name, phone };
  if (email) values.email = email;

  return { values, errors };
}

export async function createCustomerAction(
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const { values, errors } = parseFields(formData);
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
        error:
          err.firstMessage ??
          'Datos inválidos. Revisá los campos e intentá de nuevo.',
      };
    }
    return { error: 'No se pudo registrar el cliente. Intentá de nuevo.' };
  }

  revalidatePath('/clientes');
  redirect('/clientes');
}

export async function updateCustomerAction(
  id: string,
  _prev: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const { values, errors } = parseFields(formData);
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
      return { error: 'El cliente ya no existe.' };
    }
    if (err instanceof ApiError && err.status === 400) {
      return {
        error:
          err.firstMessage ??
          'Datos inválidos. Revisá los campos e intentá de nuevo.',
      };
    }
    return { error: 'No se pudo actualizar el cliente. Intentá de nuevo.' };
  }

  revalidatePath('/clientes');
  revalidatePath(`/clientes/${encodeURIComponent(id)}/editar`);
  redirect('/clientes');
}
