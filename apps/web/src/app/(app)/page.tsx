import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { apiFetch } from '@/lib/api';
import type { OrderStatus } from '@car-check/shared';
import { STATUS_STYLES } from './ordenes/constants';

type ActiveStatus = Extract<OrderStatus, 'RECIBIDO' | 'EN_PROCESO' | 'LISTO'>;

type DashboardData = {
  activeOrdersByStatus: Record<ActiveStatus, number>;
  activeOrdersTotal: number;
  revenue: { day: number; month: number };
  readyForPickup: {
    id: string;
    customerName: string;
    vehicle: {
      vin: string;
      plate: string | null;
      make: string | null;
      model: string | null;
    };
    cost: number;
    serviceDate: string;
  }[];
};

const ACTIVE_STATUSES: ActiveStatus[] = ['RECIBIDO', 'EN_PROCESO', 'LISTO'];

const currency = new Intl.NumberFormat('es-SV', {
  style: 'currency',
  currency: 'USD',
});

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('es-SV', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function DashboardPage() {
  const t = await getTranslations('dashboard');
  const tOrdenes = await getTranslations('ordenes');

  let data: DashboardData | null = null;
  let error: string | null = null;

  try {
    data = await apiFetch<DashboardData>('/dashboard');
  } catch (err) {
    error = err instanceof Error ? err.message : t('loadError');
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{t('title')}</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-8">
          {/* Ingresos */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {t('revenue.day')}
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {currency.format(data.revenue.day)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {t('revenue.month')}
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {currency.format(data.revenue.month)}
              </p>
            </div>
          </section>

          {/* Órdenes activas por estado */}
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('activeOrders.title')}
              </h2>
              <span className="text-sm text-gray-500">
                {t('activeOrders.total', { count: data.activeOrdersTotal })}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {ACTIVE_STATUSES.map((status) => (
                <Link
                  key={status}
                  href={`/ordenes?status=${status}`}
                  className="rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 hover:bg-gray-50"
                >
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
                  >
                    {tOrdenes(`status.${status}`)}
                  </span>
                  <p className="mt-3 text-3xl font-bold text-gray-900">
                    {data.activeOrdersByStatus[status]}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          {/* Autos listos para entregar */}
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('readyForPickup.title')}
              </h2>
              <Link
                href="/ordenes?status=LISTO"
                className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
              >
                {t('readyForPickup.viewAll')}
              </Link>
            </div>

            {data.readyForPickup.length === 0 ? (
              <p className="text-sm text-gray-500">
                {t('readyForPickup.empty')}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full min-w-[40rem] text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        {t('readyForPickup.columns.customer')}
                      </th>
                      <th className="px-4 py-3 text-left">
                        {t('readyForPickup.columns.vehicle')}
                      </th>
                      <th className="px-4 py-3 text-left">
                        {t('readyForPickup.columns.date')}
                      </th>
                      <th className="px-4 py-3 text-right">
                        {t('readyForPickup.columns.total')}
                      </th>
                      <th className="px-4 py-3 text-right">
                        {t('readyForPickup.columns.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.readyForPickup.map((order) => (
                      <tr
                        key={order.id}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-gray-800">
                          {order.customerName}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          <div>
                            {[order.vehicle.make, order.vehicle.model]
                              .filter(Boolean)
                              .join(' ') || '—'}
                          </div>
                          <div className="font-mono text-xs text-gray-400">
                            {order.vehicle.plate ?? order.vehicle.vin}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDate(order.serviceDate)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {currency.format(order.cost)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <Link
                            href={`/ordenes/${order.id}`}
                            className="font-medium text-gray-700 transition-colors hover:text-gray-900"
                          >
                            {t('readyForPickup.view')}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
