'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import type { OrderItemType, OrderStatus, WorkOrder } from '@car-check/shared';

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;
const ITEM_TYPES: OrderItemType[] = ['SERVICIO', 'REPUESTO'];

export type OrderFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type StatusActionState = {
  error?: string;
};

type OrderItemPayload = {
  type: OrderItemType;
  description: string;
  quantity: number;
  unitPrice: number;
};

type ParsedItems = {
  items: OrderItemPayload[];
  error?: string;
};

function parseItems(formData: FormData): ParsedItems {
  const types = formData.getAll('itemType').map(String);
  const descriptions = formData.getAll('itemDescription').map(String);
  const quantities = formData.getAll('itemQuantity').map(String);
  const prices = formData.getAll('itemUnitPrice').map(String);

  const items: OrderItemPayload[] = [];

  for (let i = 0; i < descriptions.length; i++) {
    const description = (descriptions[i] ?? '').trim();
    const rawQty = (quantities[i] ?? '').trim();
    const rawPrice = (prices[i] ?? '').trim();
    const type = types[i] as OrderItemType;

    if (!description && !rawQty && !rawPrice) continue;

    if (!description) {
      return { items: [], error: 'Cada ítem necesita una descripción.' };
    }
    if (!ITEM_TYPES.includes(type)) {
      return { items: [], error: 'Tipo de ítem inválido.' };
    }

    const quantity = rawQty ? Number(rawQty) : 1;
    if (!Number.isInteger(quantity) || quantity < 1) {
      return {
        items: [],
        error: `La cantidad de "${description}" debe ser un entero ≥ 1.`,
      };
    }

    const unitPrice = rawPrice ? Number(rawPrice) : 0;
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return {
        items: [],
        error: `El precio de "${description}" debe ser un número ≥ 0.`,
      };
    }

    items.push({ type, description, quantity, unitPrice });
  }

  if (items.length === 0) {
    return { items: [], error: 'Agregá al menos un ítem a la orden.' };
  }

  return { items };
}

type OptionalFields = {
  values: { mileage?: number; notes?: string; serviceDate?: string };
  errors: Record<string, string>;
};

function parseOptionalFields(formData: FormData): OptionalFields {
  const values: OptionalFields['values'] = {};
  const errors: Record<string, string> = {};

  const mileageRaw = String(formData.get('mileage') ?? '').trim();
  if (mileageRaw) {
    const mileage = Number(mileageRaw);
    if (!Number.isInteger(mileage) || mileage < 0) {
      errors.mileage = 'El kilometraje debe ser un número entero positivo.';
    } else {
      values.mileage = mileage;
    }
  }

  const notes = String(formData.get('notes') ?? '').trim();
  if (notes) values.notes = notes;

  const serviceDate = String(formData.get('serviceDate') ?? '').trim();
  if (serviceDate) values.serviceDate = serviceDate;

  return { values, errors };
}

export async function createOrderAction(
  _prev: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const customerId = String(formData.get('customerId') ?? '').trim();
  const vin = String(formData.get('vin') ?? '')
    .trim()
    .toUpperCase();

  const { values, errors } = parseOptionalFields(formData);

  if (!customerId) {
    errors.customerId = 'Seleccioná un cliente.';
  }
  if (!VIN_REGEX.test(vin)) {
    errors.vin = 'El VIN debe tener 17 caracteres alfanuméricos (sin I, O, Q).';
  }

  const vehicleFields: Record<string, string | number> = {};
  for (const key of ['plate', 'make', 'model'] as const) {
    const value = String(formData.get(key) ?? '').trim();
    if (value) vehicleFields[key] = value;
  }
  const yearRaw = String(formData.get('year') ?? '').trim();
  if (yearRaw) {
    const year = Number(yearRaw);
    const maxYear = new Date().getFullYear() + 1;
    if (!Number.isInteger(year) || year < 1885 || year > maxYear) {
      errors.year = `El año debe estar entre 1885 y ${maxYear}.`;
    } else {
      vehicleFields.year = year;
    }
  }

  const { items, error: itemsError } = parseItems(formData);
  if (itemsError) errors.items = itemsError;

  if (Object.keys(errors).length > 0) {
    return { fieldErrors: errors };
  }

  try {
    await apiFetch<WorkOrder>('/work-orders', {
      method: 'POST',
      body: JSON.stringify({
        vin,
        customerId,
        ...vehicleFields,
        ...values,
        items,
      }),
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return {
        fieldErrors: { customerId: 'El cliente seleccionado no existe.' },
      };
    }
    if (err instanceof ApiError && err.status === 400) {
      return {
        error:
          err.firstMessage ??
          'Datos inválidos. Revisá los campos e intentá de nuevo.',
      };
    }
    return { error: 'No se pudo crear la orden. Intentá de nuevo.' };
  }

  revalidatePath('/ordenes');
  redirect('/ordenes');
}

export async function updateOrderAction(
  id: string,
  _prev: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const { values, errors } = parseOptionalFields(formData);
  const { items, error: itemsError } = parseItems(formData);
  if (itemsError) errors.items = itemsError;

  if (Object.keys(errors).length > 0) {
    return { fieldErrors: errors };
  }

  try {
    await apiFetch<WorkOrder>(`/work-orders/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...values, items }),
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return { error: 'La orden ya no existe.' };
    }
    if (err instanceof ApiError && err.status === 400) {
      return {
        error:
          err.firstMessage ??
          'Datos inválidos. Revisá los campos e intentá de nuevo.',
      };
    }
    return { error: 'No se pudo actualizar la orden. Intentá de nuevo.' };
  }

  revalidatePath('/ordenes');
  revalidatePath(`/ordenes/${encodeURIComponent(id)}`);
  redirect(`/ordenes/${encodeURIComponent(id)}`);
}

export async function advanceStatusAction(
  _prev: StatusActionState,
  formData: FormData,
): Promise<StatusActionState> {
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '') as OrderStatus;

  try {
    await apiFetch<WorkOrder>(`/work-orders/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 400) {
      return { error: 'Transición de estado no permitida.' };
    }
    if (err instanceof ApiError && err.status === 404) {
      return { error: 'La orden ya no existe.' };
    }
    return { error: 'No se pudo cambiar el estado. Intentá de nuevo.' };
  }

  revalidatePath('/ordenes');
  revalidatePath(`/ordenes/${encodeURIComponent(id)}`);
  return {};
}
