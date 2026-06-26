import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type { Vehicle } from '@car-check/shared';

export default async function VehiculosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQ } = await searchParams;
  const q = rawQ?.trim();

  let vehicles: Vehicle[] = [];
  let error: string | null = null;

  try {
    const path = q ? `/vehicles?q=${encodeURIComponent(q)}` : '/vehicles';
    vehicles = await apiFetch<Vehicle[]>(path);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Error al cargar vehículos';
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Vehículos</h1>
        <Link
          href="/vehiculos/nuevo"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Registrar vehículo
        </Link>
      </div>

      {/* Buscador por VIN o placa */}
      <form method="get" className="mb-6 flex items-end gap-3 max-w-xl">
        <div className="flex-1">
          <label
            htmlFor="q"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-600"
          >
            Buscar
          </label>
          <div className="relative">
            <input
              id="q"
              type="text"
              name="q"
              defaultValue={q ?? ''}
              placeholder="VIN exacto o placa"
              autoComplete="off"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none"
            />
            {q && (
              <Link
                href="/vehiculos"
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
          className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Buscar
        </button>
      </form>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && vehicles.length === 0 && (
        <p className="text-sm text-gray-500">
          {q
            ? `No se encontraron vehículos para "${q}".`
            : 'No hay vehículos registrados.'}
        </p>
      )}

      {vehicles.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">VIN</th>
                <th className="px-4 py-3 text-left">Placa</th>
                <th className="px-4 py-3 text-left">Marca</th>
                <th className="px-4 py-3 text-left">Modelo</th>
                <th className="px-4 py-3 text-left">Año</th>
                <th className="px-4 py-3 text-left">Kilometraje</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-800">{v.vin}</td>
                  <td className="px-4 py-3 text-gray-600">{v.plate ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{v.make ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{v.model ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{v.year ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {v.mileage != null
                      ? `${v.mileage.toLocaleString()} km`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      href={`/vehiculos/${encodeURIComponent(v.vin)}/editar`}
                      className="font-medium text-gray-700 transition-colors hover:text-gray-900"
                    >
                      Editar
                    </Link>
                    <Link
                      href={`/historial?vin=${encodeURIComponent(v.vin)}`}
                      className="ml-4 font-medium text-gray-500 transition-colors hover:text-gray-900"
                    >
                      Historial
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
