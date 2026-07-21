import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createVehicleAction } from '../actions';
import { VehicleForm } from '../VehicleForm';

export default async function NuevoVehiculoPage() {
  const t = await getTranslations('vehiculos');
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link
        href="/vehiculos"
        className="mb-4 inline-block text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        {t('back')}
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{t('newTitle')}</h1>
      <VehicleForm action={createVehicleAction} submitLabel={t('submitNew')} />
    </div>
  );
}
