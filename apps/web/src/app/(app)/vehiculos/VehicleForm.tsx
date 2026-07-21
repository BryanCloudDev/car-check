'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import type { Vehicle } from '@car-check/shared';
import type { VehicleFormState } from './actions';

type VehicleFormAction = (
  state: VehicleFormState,
  formData: FormData,
) => Promise<VehicleFormState>;

const labelClass =
  'mb-1 block text-xs font-medium uppercase tracking-wide text-gray-600';
const inputClass =
  'w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  const t = useTranslations('vehiculos.form');
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? t('saving') : label}
    </button>
  );
}

export function VehicleForm({
  action,
  vehicle,
  submitLabel,
}: {
  action: VehicleFormAction;
  vehicle?: Vehicle;
  submitLabel: string;
}) {
  const t = useTranslations('vehiculos.form');
  const [state, formAction] = useActionState<VehicleFormState, FormData>(
    action,
    {},
  );
  const fieldErrors = state.fieldErrors ?? {};
  const isEdit = Boolean(vehicle);

  return (
    <form action={formAction} className="max-w-2xl space-y-5">
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="vin" className={labelClass}>
          {t('vin')}
        </label>
        {isEdit ? (
          <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 font-mono text-sm text-gray-500">
            {vehicle?.vin}
          </p>
        ) : (
          <>
            <input
              id="vin"
              name="vin"
              type="text"
              autoComplete="off"
              maxLength={17}
              placeholder={t('vinPlaceholder')}
              className={`${inputClass} font-mono uppercase placeholder:font-sans placeholder:normal-case`}
              aria-invalid={Boolean(fieldErrors.vin)}
            />
            <FieldError message={fieldErrors.vin} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="plate" className={labelClass}>
            {t('plate')}
          </label>
          <input
            id="plate"
            name="plate"
            type="text"
            autoComplete="off"
            placeholder={t('platePlaceholder')}
            defaultValue={vehicle?.plate ?? ''}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="make" className={labelClass}>
            {t('make')}
          </label>
          <input
            id="make"
            name="make"
            type="text"
            autoComplete="off"
            placeholder={t('makePlaceholder')}
            defaultValue={vehicle?.make ?? ''}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="model" className={labelClass}>
            {t('model')}
          </label>
          <input
            id="model"
            name="model"
            type="text"
            autoComplete="off"
            placeholder={t('modelPlaceholder')}
            defaultValue={vehicle?.model ?? ''}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="year" className={labelClass}>
            {t('year')}
          </label>
          <input
            id="year"
            name="year"
            type="number"
            inputMode="numeric"
            placeholder={t('yearPlaceholder')}
            defaultValue={vehicle?.year ?? ''}
            className={inputClass}
            aria-invalid={Boolean(fieldErrors.year)}
          />
          <FieldError message={fieldErrors.year} />
        </div>
        <div>
          <label htmlFor="mileage" className={labelClass}>
            {t('mileage')}
          </label>
          <input
            id="mileage"
            name="mileage"
            type="number"
            inputMode="numeric"
            placeholder={t('mileagePlaceholder')}
            defaultValue={vehicle?.mileage ?? ''}
            className={inputClass}
            aria-invalid={Boolean(fieldErrors.mileage)}
          />
          <FieldError message={fieldErrors.mileage} />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton label={submitLabel} />
        <Link
          href="/vehiculos"
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          {t('cancel')}
        </Link>
      </div>
    </form>
  );
}
