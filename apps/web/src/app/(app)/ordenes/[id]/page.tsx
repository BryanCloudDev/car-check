import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import { MediaUpload } from '@/components/MediaUpload';
import type {
  Customer,
  OrderItem,
  Vehicle,
  WorkOrder,
} from '@car-check/shared';
import { STATUS_LABELS, STATUS_STYLES } from '../constants';
import { StatusActions } from './StatusActions';

type OrderWithRelations = WorkOrder & {
  items: OrderItem[];
  vehicle: Vehicle;
  customer: Customer;
};

const currency = new Intl.NumberFormat('es-SV', {
  style: 'currency',
  currency: 'USD',
});

function formatMoney(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isNaN(n) ? '—' : currency.format(n);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('es-SV', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function OrdenDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let order: OrderWithRelations;
  try {
    order = await apiFetch<OrderWithRelations>(
      `/work-orders/${encodeURIComponent(id)}`,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="p-8">
      <Link
        href="/ordenes"
        className="text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        ← Órdenes
      </Link>

      <div className="mb-6 mt-2 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            Orden{' '}
            <span className="font-mono text-gray-500">
              {order.id.slice(0, 8).toUpperCase()}
            </span>
          </h1>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[order.status]}`}
          >
            {STATUS_LABELS[order.status]}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/ordenes/${order.id}/editar`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            Editar
          </Link>
          <a
            href={`/api/work-orders/${order.id}/receipt`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            Descargar PDF
          </a>
        </div>
      </div>

      {/* Cliente + vehículo */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
            Cliente
          </h2>
          <p className="text-gray-900">{order.customer.name}</p>
          {order.customer.phone && (
            <p className="text-sm text-gray-500">{order.customer.phone}</p>
          )}
          {order.customer.email && (
            <p className="text-sm text-gray-500">{order.customer.email}</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
            Vehículo
          </h2>
          <p className="text-gray-900">
            {[order.vehicle.make, order.vehicle.model, order.vehicle.year]
              .filter(Boolean)
              .join(' ') || 'Vehículo'}
          </p>
          <p className="font-mono text-sm text-gray-500">{order.vehicle.vin}</p>
          {order.vehicle.plate && (
            <p className="text-sm text-gray-500">
              Placa: {order.vehicle.plate}
            </p>
          )}
        </div>
      </div>

      {/* Datos de la orden */}
      <dl className="mb-6 grid grid-cols-2 gap-x-8 gap-y-3 rounded-xl border border-gray-200 bg-white p-5 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-gray-500">Fecha de servicio</dt>
          <dd className="text-gray-900">{formatDate(order.serviceDate)}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Kilometraje</dt>
          <dd className="text-gray-900">
            {order.mileage != null
              ? `${order.mileage.toLocaleString()} km`
              : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Total</dt>
          <dd className="font-semibold text-gray-900">
            {formatMoney(order.cost)}
          </dd>
        </div>
      </dl>

      {order.notes && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
            Notas
          </h2>
          <p className="text-sm text-gray-700">{order.notes}</p>
        </div>
      )}

      {/* Ítems */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
        Ítems ({order.items.length})
      </h2>
      {order.items.length === 0 ? (
        <p className="mb-6 text-sm text-gray-500">Esta orden no tiene ítems.</p>
      ) : (
        <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left">Descripción</th>
                <th className="px-4 py-2 text-left">Tipo</th>
                <th className="px-4 py-2 text-right">Cant.</th>
                <th className="px-4 py-2 text-right">P. unit.</th>
                <th className="px-4 py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2 text-gray-800">
                    {item.description}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {item.type === 'SERVICIO' ? 'Servicio' : 'Repuesto'}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-600">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-600">
                    {formatMoney(item.unitPrice)}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-800">
                    {formatMoney(Number(item.unitPrice) * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cambiar estado */}
      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
          Estado
        </h2>
        <StatusActions orderId={order.id} status={order.status} />
      </section>

      {/* Media */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
          Fotos y videos
        </h2>
        <MediaUpload orderId={order.id} />
      </section>
    </div>
  );
}
