'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
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

function parseOptionalFields(formData: FormData): ParsedFields {
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
      errors.year = `El año debe estar entre 1885 y ${maxYear}.`;
    } else {
      values.year = year;
    }
  }

  const mileageRaw = String(formData.get('mileage') ?? '').trim();
  if (mileageRaw) {
    const mileage = Number(mileageRaw);
    if (!Number.isInteger(mileage) || mileage < 0) {
      errors.mileage = 'El kilometraje debe ser un número entero positivo.';
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
  const vin = String(formData.get('vin') ?? '')
    .trim()
    .toUpperCase();
  const { values, errors } = parseOptionalFields(formData);

  if (!VIN_REGEX.test(vin)) {
    errors.vin = 'El VIN debe tener 17 caracteres alfanuméricos (sin I, O, Q).';
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
      return { fieldErrors: { vin: 'Ya existe un vehículo con ese VIN.' } };
    }
    if (err instanceof ApiError && err.status === 400) {
      return {
        error:
          err.firstMessage ??
          'Datos inválidos. Revisá los campos e intentá de nuevo.',
      };
    }
    return { error: 'No se pudo registrar el vehículo. Intentá de nuevo.' };
  }

  revalidatePath('/vehiculos');
  redirect('/vehiculos');
}

export async function updateVehicleAction(
  vin: string,
  _prev: VehicleFormState,
  formData: FormData,
): Promise<VehicleFormState> {
  const { values, errors } = parseOptionalFields(formData);
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
      return { error: 'El vehículo ya no existe.' };
    }
    if (err instanceof ApiError && err.status === 400) {
      return {
        error:
          err.firstMessage ??
          'Datos inválidos. Revisá los campos e intentá de nuevo.',
      };
    }
    return { error: 'No se pudo actualizar el vehículo. Intentá de nuevo.' };
  }

  revalidatePath('/vehiculos');
  revalidatePath(`/vehiculos/${encodeURIComponent(vin)}/editar`);
  redirect('/vehiculos');
}
