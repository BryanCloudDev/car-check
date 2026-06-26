import Link from 'next/link';
import { createCustomerAction } from '../actions';
import { CustomerForm } from '../CustomerForm';

export default function NuevoClientePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link
        href="/clientes"
        className="mb-4 inline-block text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        ← Volver a clientes
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Registrar cliente
      </h1>
      <CustomerForm action={createCustomerAction} submitLabel="Registrar" />
    </div>
  );
}
