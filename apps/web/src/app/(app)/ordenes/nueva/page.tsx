import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { apiFetch } from '@/lib/api';
import type { Customer } from '@car-check/shared';
import { OrderForm } from '../OrderForm';
import { createOrderAction } from '../actions';

export default async function NuevaOrdenPage() {
  const t = await getTranslations('ordenes');
  let customers: Customer[] = [];
  let error: string | null = null;

  try {
    customers = await apiFetch<Customer[]>('/customers');
  } catch (err) {
    error = err instanceof Error ? err.message : t('loadCustomersError');
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link
        href="/ordenes"
        className="text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        {t('create.back')}
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold text-gray-900">
        {t('create.title')}
      </h1>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <OrderForm
          action={createOrderAction}
          customers={customers}
          submitLabel={t('create.submit')}
          cancelHref="/ordenes"
        />
      )}
    </div>
  );
}
