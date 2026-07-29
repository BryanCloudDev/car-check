import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { WorkshopProfile } from '@car-check/shared';
import { apiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { LogoUpload } from './LogoUpload';
import { WorkshopForm } from './WorkshopForm';

export default async function ConfiguracionPage() {
  // El backend ya exige ADMIN en el PATCH; esto evita mostrar un form inútil.
  const { role } = await getCurrentUser();
  if (role !== 'ADMIN') redirect('/ordenes');

  const t = await getTranslations('configuracion');

  let workshop: WorkshopProfile;
  try {
    workshop = await apiFetch<WorkshopProfile>('/workshops/me');
  } catch {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-red-600">{t('loadError')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
      <p className="mt-1 mb-6 max-w-2xl text-sm text-gray-500">
        {t('description')}
      </p>

      <div className="max-w-2xl space-y-8">
        <LogoUpload logoUrl={workshop.logoUrl} />
        <WorkshopForm workshop={workshop} />
      </div>
    </div>
  );
}
