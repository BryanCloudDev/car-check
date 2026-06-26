import Link from 'next/link';
import { ApiError, apiFetch } from '@/lib/api';
import type {
  OrderItem,
  OrderStatus,
  Vehicle,
  WorkOrder,
} from '@car-check/shared';

type WorkOrderWithItems = WorkOrder & { items: OrderItem[] };

const STATUS_LABELS: Record<OrderStatus, string> = {
  RECIBIDO: 'Recibido',
  EN_PROCESO: 'En proceso',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  RECIBIDO: 'bg-gray-100 text-gray-700',
  EN_PROCESO: 'bg-amber-100 text-amber-700',
  LISTO: 'bg-blue-100 text-blue-700',
  ENTREGADO: 'bg-green-100 text-green-700',
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

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<{ vin?: string }>;
}) {
  const { vin: rawVin } = await searchParams;
  const vin = rawVin?.trim().toUpperCase();

  let vehicle: Vehicle | null = null;
  let history: WorkOrderWithItems[] = [];
  let error: string | null = null;

  if (vin) {
    const path = `/vehicles/${encodeURIComponent(vin)}`;
    try {
      [vehicle, history] = await Promise.all([
        apiFetch<Vehicle>(path),
        apiFetch<WorkOrderWithItems[]>(`${path}/history`),
      ]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        error = `No se encontró ningún vehículo con el VIN "${vin}".`;
      } else if (err instanceof ApiError && err.status === 400) {
        error = 'El VIN ingresado no es válido (debe tener 17 caracteres).';
      } else {
        error = 'Ocurrió un error al consultar el historial.';
      }
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Historial por VIN
      </h1>

      {/* Buscador */}
      <form method="get" className="mb-8 flex items-end gap-3 max-w-xl">
        <div className="flex-1">
          <label
            htmlFor="vin"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-600"
          >
            VIN
          </label>
          <div className="relative">
            <input
              id="vin"
              type="text"
              name="vin"
              defaultValue={vin ?? ''}
              placeholder="Ingresá el VIN (17 caracteres)"
              autoComplete="off"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-9 text-sm font-mono uppercase text-gray-900 placeholder:font-sans placeholder:normal-case placeholder:text-gray-400 focus:border-gray-500 focus:outline-none"
            />
            {vin && (
              <Link
                href="/historial"
                aria-label="Limpiar búsqueda"
                className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-base leading-none text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                ×
              </Link>
            )}
          </div>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          Buscar
        </button>
      </form>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!vin && !error && (
        <p className="text-sm text-gray-500">
          Ingresá un VIN para consultar el historial completo del vehículo.
        </p>
      )}

      {vehicle && (
        <>
          {/* Datos del vehículo */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {[vehicle.make, vehicle.model, vehicle.year]
                  .filter(Boolean)
                  .join(' ') || 'Vehículo'}
              </h2>
              <span className="font-mono text-sm text-gray-500">
                {vehicle.vin}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-gray-500">Placa</dt>
                <dd className="text-gray-900">{vehicle.plate ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Marca</dt>
                <dd className="text-gray-900">{vehicle.make ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Modelo</dt>
                <dd className="text-gray-900">{vehicle.model ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Kilometraje</dt>
                <dd className="text-gray-900">
                  {vehicle.mileage != null
                    ? `${vehicle.mileage.toLocaleString()} km`
                    : '—'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Historial de órdenes */}
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
            Órdenes de trabajo ({history.length})
          </h2>

          {history.length === 0 ? (
            <p className="text-sm text-gray-500">
              Este vehículo no tiene órdenes de trabajo registradas.
            </p>
          ) : (
            <ol className="space-y-4">
              {history.map((order) => (
                <li
                  key={order.id}
                  className="rounded-xl border border-gray-200 bg-white p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[order.status]}`}
                      >
                        {STATUS_LABELS[order.status]}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(order.serviceDate)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatMoney(order.cost)}
                      </div>
                      {order.mileage != null && (
                        <div className="text-xs text-gray-500">
                          {order.mileage.toLocaleString()} km
                        </div>
                      )}
                    </div>
                  </div>

                  {order.notes && (
                    <p className="mt-3 text-sm text-gray-600">{order.notes}</p>
                  )}

                  {order.items.length > 0 && (
                    <div className="mt-4 overflow-x-auto rounded-lg border border-gray-100">
                      <table className="w-full min-w-[32rem] text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                          <tr>
                            <th className="px-3 py-2 text-left">Descripción</th>
                            <th className="px-3 py-2 text-left">Tipo</th>
                            <th className="px-3 py-2 text-right">Cant.</th>
                            <th className="px-3 py-2 text-right">P. unit.</th>
                            <th className="px-3 py-2 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {order.items.map((item) => (
                            <tr key={item.id}>
                              <td className="px-3 py-2 text-gray-800">
                                {item.description}
                              </td>
                              <td className="px-3 py-2 text-gray-500">
                                {item.type === 'SERVICIO'
                                  ? 'Servicio'
                                  : 'Repuesto'}
                              </td>
                              <td className="px-3 py-2 text-right text-gray-600">
                                {item.quantity}
                              </td>
                              <td className="px-3 py-2 text-right text-gray-600">
                                {formatMoney(item.unitPrice)}
                              </td>
                              <td className="px-3 py-2 text-right text-gray-800">
                                {formatMoney(
                                  Number(item.unitPrice) * item.quantity,
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
