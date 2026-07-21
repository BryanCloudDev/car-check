import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createCustomerAction } from '../actions';
import { CustomerForm } from '../CustomerForm';

export default async function NuevoClientePage() {
  const t = await getTranslations('clientes');
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link
        href="/clientes"
        className="mb-4 inline-block text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        {t('back')}
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{t('newTitle')}</h1>
      <CustomerForm
        action={createCustomerAction}
        submitLabel={t('submitNew')}
      />
    </div>
  );
}
