import Link from 'next/link';
import { createVehicleAction } from '../actions';
import { VehicleForm } from '../VehicleForm';

export default function NuevoVehiculoPage() {
  return (
    <div className="p-8">
      <Link
        href="/vehiculos"
        className="mb-4 inline-block text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        ← Volver a vehículos
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Registrar vehículo
      </h1>
      <VehicleForm action={createVehicleAction} submitLabel="Registrar" />
    </div>
  );
}
