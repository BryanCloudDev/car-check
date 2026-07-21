import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ApiError, apiFetch } from '@/lib/api';
import type { Vehicle } from '@car-check/shared';
import { updateVehicleAction } from '../../actions';
import { VehicleForm } from '../../VehicleForm';

export default async function EditarVehiculoPage({
  params,
}: {
  params: Promise<{ vin: string }>;
}) {
  const t = await getTranslations('vehiculos');
  const { vin: rawVin } = await params;
  const vin = decodeURIComponent(rawVin).trim().toUpperCase();

  let vehicle: Vehicle;
  try {
    vehicle = await apiFetch<Vehicle>(`/vehicles/${encodeURIComponent(vin)}`);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
      notFound();
    }
    throw err;
  }

  const action = updateVehicleAction.bind(null, vehicle.vin);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link
        href="/vehiculos"
        className="mb-4 inline-block text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        {t('back')}
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        {t('editTitle')}
      </h1>
      <VehicleForm
        action={action}
        vehicle={vehicle}
        submitLabel={t('submitEdit')}
      />
    </div>
  );
}
