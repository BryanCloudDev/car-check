'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ApiError, apiFetch } from '@/lib/api';
import type { OrderItemType, OrderStatus, WorkOrder } from '@car-check/shared';

type Translator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

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

function parseItems(formData: FormData, t: Translator): ParsedItems {
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
      return { items: [], error: t('itemNeedsDescription') };
    }
    if (!ITEM_TYPES.includes(type)) {
      return { items: [], error: t('invalidItemType') };
    }

    const quantity = rawQty ? Number(rawQty) : 1;
    if (!Number.isInteger(quantity) || quantity < 1) {
      return {
        items: [],
        error: t('quantityMin', { description }),
      };
    }

    const unitPrice = rawPrice ? Number(rawPrice) : 0;
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return {
        items: [],
        error: t('priceMin', { description }),
      };
    }

    items.push({ type, description, quantity, unitPrice });
  }

  if (items.length === 0) {
    return { items: [], error: t('atLeastOneItem') };
  }

  return { items };
}

type OptionalFields = {
  values: { mileage?: number; notes?: string; serviceDate?: string };
  errors: Record<string, string>;
};

function parseOptionalFields(
  formData: FormData,
  t: Translator,
): OptionalFields {
  const values: OptionalFields['values'] = {};
  const errors: Record<string, string> = {};

  const mileageRaw = String(formData.get('mileage') ?? '').trim();
  if (mileageRaw) {
    const mileage = Number(mileageRaw);
    if (!Number.isInteger(mileage) || mileage < 0) {
      errors.mileage = t('mileageInvalid');
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
  const t = await getTranslations('ordenes.errors');
  const customerId = String(formData.get('customerId') ?? '').trim();
  const vin = String(formData.get('vin') ?? '')
    .trim()
    .toUpperCase();

  const { values, errors } = parseOptionalFields(formData, t);

  if (!customerId) {
    errors.customerId = t('selectCustomer');
  }
  if (!VIN_REGEX.test(vin)) {
    errors.vin = t('vinInvalid');
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
      errors.year = t('yearRange', { max: maxYear });
    } else {
      vehicleFields.year = year;
    }
  }

  const { items, error: itemsError } = parseItems(formData, t);
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
        fieldErrors: { customerId: t('customerNotFound') },
      };
    }
    if (err instanceof ApiError && err.status === 400) {
      return {
        error: err.firstMessage ?? t('invalidData'),
      };
    }
    return { error: t('createFailed') };
  }

  revalidatePath('/ordenes');
  redirect('/ordenes');
}

export async function updateOrderAction(
  id: string,
  _prev: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const t = await getTranslations('ordenes.errors');
  const { values, errors } = parseOptionalFields(formData, t);
  const { items, error: itemsError } = parseItems(formData, t);
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
      return { error: t('notFound') };
    }
    if (err instanceof ApiError && err.status === 400) {
      return {
        error: err.firstMessage ?? t('invalidData'),
      };
    }
    return { error: t('updateFailed') };
  }

  revalidatePath('/ordenes');
  revalidatePath(`/ordenes/${encodeURIComponent(id)}`);
  redirect(`/ordenes/${encodeURIComponent(id)}`);
}

export async function advanceStatusAction(
  _prev: StatusActionState,
  formData: FormData,
): Promise<StatusActionState> {
  const t = await getTranslations('ordenes.errors');
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '') as OrderStatus;

  try {
    await apiFetch<WorkOrder>(`/work-orders/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 400) {
      return { error: t('invalidTransition') };
    }
    if (err instanceof ApiError && err.status === 404) {
      return { error: t('notFound') };
    }
    return { error: t('statusChangeFailed') };
  }

  revalidatePath('/ordenes');
  revalidatePath(`/ordenes/${encodeURIComponent(id)}`);
  return {};
}
