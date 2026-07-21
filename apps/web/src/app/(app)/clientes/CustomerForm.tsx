'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import type { Customer } from '@car-check/shared';
import type { CustomerFormState } from './actions';

type CustomerFormAction = (
  state: CustomerFormState,
  formData: FormData,
) => Promise<CustomerFormState>;

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
  const t = useTranslations('clientes.form');
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

export function CustomerForm({
  action,
  customer,
  submitLabel,
}: {
  action: CustomerFormAction;
  customer?: Customer;
  submitLabel: string;
}) {
  const t = useTranslations('clientes.form');
  const [state, formAction] = useActionState<CustomerFormState, FormData>(
    action,
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

      <div>
        <label htmlFor="name" className={labelClass}>
          {t('name')}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="off"
          placeholder={t('namePlaceholder')}
          defaultValue={customer?.name ?? ''}
          className={inputClass}
          aria-invalid={Boolean(fieldErrors.name)}
        />
        <FieldError message={fieldErrors.name} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className={labelClass}>
            {t('phone')}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="off"
            placeholder={t('phonePlaceholder')}
            defaultValue={customer?.phone ?? ''}
            className={inputClass}
            aria-invalid={Boolean(fieldErrors.phone)}
          />
          <FieldError message={fieldErrors.phone} />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            {t('email')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="off"
            placeholder={t('emailPlaceholder')}
            defaultValue={customer?.email ?? ''}
            className={inputClass}
            aria-invalid={Boolean(fieldErrors.email)}
          />
          <FieldError message={fieldErrors.email} />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton label={submitLabel} />
        <Link
          href="/clientes"
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          {t('cancel')}
        </Link>
      </div>
    </form>
  );
}
