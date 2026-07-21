import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { apiFetch } from '@/lib/api';
import type { Vehicle } from '@car-check/shared';

export default async function VehiculosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const t = await getTranslations('vehiculos');
  const { q: rawQ } = await searchParams;
  const q = rawQ?.trim();

  let vehicles: Vehicle[] = [];
  let error: string | null = null;

  try {
    const path = q ? `/vehicles?q=${encodeURIComponent(q)}` : '/vehicles';
    vehicles = await apiFetch<Vehicle[]>(path);
  } catch (err) {
    error = err instanceof Error ? err.message : t('loadError');
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <Link
          href="/vehiculos/nuevo"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          {t('register')}
        </Link>
      </div>

      {/* Buscador por VIN o placa */}
      <form method="get" className="mb-6 flex items-end gap-3 max-w-xl">
        <div className="flex-1">
          <label
            htmlFor="q"
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-600"
          >
            {t('search')}
          </label>
          <div className="relative">
            <input
              id="q"
              type="text"
              name="q"
              defaultValue={q ?? ''}
              placeholder={t('searchPlaceholder')}
              autoComplete="off"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none"
            />
            {q && (
              <Link
                href="/vehiculos"
                aria-label={t('clearSearch')}
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
          {t('searchButton')}
        </button>
      </form>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && vehicles.length === 0 && (
        <p className="text-sm text-gray-500">
          {q ? t('noResults', { query: q }) : t('empty')}
        </p>
      )}

      {vehicles.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[48rem] text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">{t('columns.vin')}</th>
                <th className="px-4 py-3 text-left">{t('columns.plate')}</th>
                <th className="px-4 py-3 text-left">{t('columns.make')}</th>
                <th className="px-4 py-3 text-left">{t('columns.model')}</th>
                <th className="px-4 py-3 text-left">{t('columns.year')}</th>
                <th className="px-4 py-3 text-left">{t('columns.mileage')}</th>
                <th className="px-4 py-3 text-right">{t('columns.actions')}</th>
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
                      {t('edit')}
                    </Link>
                    <Link
                      href={`/historial?vin=${encodeURIComponent(v.vin)}`}
                      className="ml-4 font-medium text-gray-500 transition-colors hover:text-gray-900"
                    >
                      {t('history')}
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
