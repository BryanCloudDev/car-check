import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type {
  Customer,
  OrderItem,
  OrderStatus,
  Vehicle,
  WorkOrder,
} from '@car-check/shared';
import { ORDER_STATUSES, STATUS_LABELS, STATUS_STYLES } from './constants';

type OrderWithRelations = WorkOrder & {
  items: OrderItem[];
  vehicle: Vehicle;
  customer: Customer;
};

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

function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as string[]).includes(value);
}

export default async function OrdenesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: rawStatus } = await searchParams;
  const status = rawStatus && isOrderStatus(rawStatus) ? rawStatus : undefined;

  let orders: OrderWithRelations[] = [];
  let error: string | null = null;

  try {
    const path = status ? `/work-orders?status=${status}` : '/work-orders';
    orders = await apiFetch<OrderWithRelations[]>(path);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Error al cargar órdenes';
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Órdenes de trabajo</h1>
        <Link
          href="/ordenes/nueva"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Nueva orden
        </Link>
      </div>

      {/* Filtro por estado */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/ordenes"
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            !status
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todas
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/ordenes?status=${s}`}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              status === s
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && orders.length === 0 && (
        <p className="text-sm text-gray-500">
          {status
            ? `No hay órdenes en estado "${STATUS_LABELS[status]}".`
            : 'No hay órdenes registradas.'}
        </p>
      )}

      {orders.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Vehículo</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[order.status]}`}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-800">
                    {order.customer?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>
                      {[order.vehicle?.make, order.vehicle?.model]
                        .filter(Boolean)
                        .join(' ') || '—'}
                    </div>
                    <div className="font-mono text-xs text-gray-400">
                      {order.vehicle?.vin}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(order.serviceDate)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {currency.format(Number(order.cost))}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      href={`/ordenes/${order.id}`}
                      className="font-medium text-gray-700 transition-colors hover:text-gray-900"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
