import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api';
import type { Customer } from '@car-check/shared';
import { updateCustomerAction } from '../../actions';
import { CustomerForm } from '../../CustomerForm';

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);

  let customer: Customer;
  try {
    customer = await apiFetch<Customer>(`/customers/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
      notFound();
    }
    throw err;
  }

  const action = updateCustomerAction.bind(null, customer.id);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link
        href="/clientes"
        className="mb-4 inline-block text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        ← Volver a clientes
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Editar cliente</h1>
      <CustomerForm
        action={action}
        customer={customer}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
