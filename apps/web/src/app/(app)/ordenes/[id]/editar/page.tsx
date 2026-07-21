import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ApiError, apiFetch } from '@/lib/api';
import type { OrderItem, WorkOrder } from '@car-check/shared';
import { OrderForm } from '../../OrderForm';
import { updateOrderAction } from '../../actions';

type OrderWithItems = WorkOrder & { items: OrderItem[] };

export default async function EditarOrdenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations('ordenes');

  let order: OrderWithItems;
  try {
    order = await apiFetch<OrderWithItems>(
      `/work-orders/${encodeURIComponent(id)}`,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const action = updateOrderAction.bind(null, id);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link
        href={`/ordenes/${id}`}
        className="text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        {t('edit.back')}
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold text-gray-900">
        {t('edit.title')}{' '}
        <span className="font-mono text-gray-500">
          {id.slice(0, 8).toUpperCase()}
        </span>
      </h1>

      <OrderForm
        action={action}
        order={order}
        submitLabel={t('edit.submit')}
        cancelHref={`/ordenes/${id}`}
      />
    </div>
  );
}
