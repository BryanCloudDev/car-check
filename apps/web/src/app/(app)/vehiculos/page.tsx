import { apiFetch } from '@/lib/api';
import type { Vehicle } from '@car-check/shared';

export default async function VehiculosPage() {
  let vehicles: Vehicle[] = [];
  let error: string | null = null;

  try {
    vehicles = await apiFetch<Vehicle[]>('/vehicles');
  } catch (err) {
    error = err instanceof Error ? err.message : 'Error al cargar vehículos';
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Vehículos</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && vehicles.length === 0 && (
        <p className="text-sm text-gray-500">No hay vehículos registrados.</p>
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
                    {v.mileage != null ? `${v.mileage.toLocaleString()} km` : '—'}
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
