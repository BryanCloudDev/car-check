import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type { Customer } from '@car-check/shared';
import { CustomersTable } from './CustomersTable';

export default async function ClientesPage() {
  let customers: Customer[] = [];
  let error: string | null = null;

  try {
    customers = await apiFetch<Customer[]>('/customers');
  } catch (err) {
    error = err instanceof Error ? err.message : 'Error al cargar clientes';
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <Link
          href="/clientes/nuevo"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Registrar cliente
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && customers.length === 0 && (
        <p className="text-sm text-gray-500">No hay clientes registrados.</p>
      )}

      {!error && customers.length > 0 && (
        <CustomersTable customers={customers} />
      )}
    </div>
  );
}
