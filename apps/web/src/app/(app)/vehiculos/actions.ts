'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ApiError, apiFetch } from '@/lib/api';
import type { Vehicle } from '@car-check/shared';

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

export type VehicleFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

type ParsedFields = {
  values: Record<string, string | number>;
  errors: Record<string, string>;
};

function parseOptionalFields(
  formData: FormData,
  t: (key: string, values?: Record<string, string | number>) => string,
): ParsedFields {
  const values: Record<string, string | number> = {};
  const errors: Record<string, string> = {};

  for (const key of ['plate', 'make', 'model'] as const) {
    const value = String(formData.get(key) ?? '').trim();
    if (value) values[key] = value;
  }

  const yearRaw = String(formData.get('year') ?? '').trim();
  if (yearRaw) {
    const year = Number(yearRaw);
    const maxYear = new Date().getFullYear() + 1;
    if (!Number.isInteger(year) || year < 1885 || year > maxYear) {
      errors.year = t('yearRange', { max: maxYear });
    } else {
      values.year = year;
    }
  }

  const mileageRaw = String(formData.get('mileage') ?? '').trim();
  if (mileageRaw) {
    const mileage = Number(mileageRaw);
    if (!Number.isInteger(mileage) || mileage < 0) {
      errors.mileage = t('mileageInvalid');
    } else {
      values.mileage = mileage;
    }
  }

  return { values, errors };
}

export async function createVehicleAction(
  _prev: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  const t = await getTranslations('vehiculos.errors');
  const vin = String(formData.get('vin') ?? '')
    .trim()
    .toUpperCase();
  const { values, errors } = parseOptionalFields(formData, t);

  if (!VIN_REGEX.test(vin)) {
    errors.vin = t('vinInvalid');
  }
  if (Object.keys(errors).length > 0) {
    return { fieldErrors: errors };
  }

  try {
    await apiFetch<Vehicle>('/vehicles', {
      method: 'POST',
      body: JSON.stringify({ vin, ...values }),
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      return { fieldErrors: { vin: t('vinExists') } };
    }
    if (err instanceof ApiError && err.status === 400) {
      return {
        error: err.firstMessage ?? t('invalidData'),
      };
    }
    return { error: t('createFailed') };
  }

  revalidatePath('/vehiculos');
  redirect('/vehiculos');
}

export async function updateVehicleAction(
  vin: string,
  _prev: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  const t = await getTranslations('vehiculos.errors');
  const { values, errors } = parseOptionalFields(formData, t);
  if (Object.keys(errors).length > 0) {
    return { fieldErrors: errors };
  }

  try {
    await apiFetch<Vehicle>(`/vehicles/${encodeURIComponent(vin)}`, {
      method: 'PATCH',
      body: JSON.stringify(values),
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

  revalidatePath('/vehiculos');
  revalidatePath(`/vehiculos/${encodeURIComponent(vin)}/editar`);
  redirect('/vehiculos');
}
