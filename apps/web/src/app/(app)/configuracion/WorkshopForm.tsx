'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import type { WorkshopProfile } from '@car-check/shared';
import { updateWorkshopAction, type WorkshopFormState } from './actions';

const labelClass =
  'mb-1 block text-xs font-medium uppercase tracking-wide text-gray-600';
const inputClass =
  'w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations('configuracion.form');
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? t('saving') : t('submit')}
    </button>
  );
}

export function WorkshopForm({ workshop }: { workshop: WorkshopProfile }) {
  const t = useTranslations('configuracion.form');
  const [state, formAction] = useActionState<WorkshopFormState, FormData>(
    updateWorkshopAction,
    {},
  );
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state.success && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {t('saved')}
        </div>
      )}

      <div>
        <label htmlFor="name" className={labelClass}>
          {t('name')}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="organization"
          placeholder={t('namePlaceholder')}
          defaultValue={workshop.name}
          className={inputClass}
          aria-invalid={Boolean(fieldErrors.name)}
        />
        <FieldError message={fieldErrors.name} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className={labelClass}>
            {t('email')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t('emailPlaceholder')}
            defaultValue={workshop.email}
            className={inputClass}
            aria-invalid={Boolean(fieldErrors.email)}
          />
          <FieldError message={fieldErrors.email} />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>
            {t('phone')}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder={t('phonePlaceholder')}
            defaultValue={workshop.phone ?? ''}
            className={inputClass}
            aria-invalid={Boolean(fieldErrors.phone)}
          />
          <FieldError message={fieldErrors.phone} />
        </div>
      </div>

      <div>
        <label htmlFor="address" className={labelClass}>
          {t('address')}
        </label>
        <input
          id="address"
          name="address"
          type="text"
          autoComplete="street-address"
          placeholder={t('addressPlaceholder')}
          defaultValue={workshop.address ?? ''}
          className={inputClass}
          aria-invalid={Boolean(fieldErrors.address)}
        />
        <FieldError message={fieldErrors.address} />
      </div>

      <div>
        <label htmlFor="nit" className={labelClass}>
          {t('nit')}
        </label>
        <input
          id="nit"
          name="nit"
          type="text"
          autoComplete="off"
          placeholder={t('nitPlaceholder')}
          defaultValue={workshop.nit ?? ''}
          className={inputClass}
          aria-describedby="nit-hint"
          aria-invalid={Boolean(fieldErrors.nit)}
        />
        <p id="nit-hint" className="mt-1 text-xs text-gray-500">
          {t('nitHint')}
        </p>
        <FieldError message={fieldErrors.nit} />
      </div>

      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
