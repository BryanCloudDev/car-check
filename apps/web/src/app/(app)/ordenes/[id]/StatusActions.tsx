'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import type { OrderStatus } from '@car-check/shared';
import { advanceStatusAction, type StatusActionState } from '../actions';
import { VALID_TRANSITIONS } from '../constants';

function TransitionButton({ target }: { target: OrderStatus }) {
  const { pending } = useFormStatus();
  const t = useTranslations('ordenes');
  return (
    <button
      type="submit"
      name="status"
      value={target}
      disabled={pending}
      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending
        ? t('statusActions.updating')
        : t('statusActions.markAs', { status: t(`status.${target}`) })}
    </button>
  );
}

export function StatusActions({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const t = useTranslations('ordenes');
  const [state, formAction] = useActionState<StatusActionState, FormData>(
    advanceStatusAction,
    {},
  );
  const transitions = VALID_TRANSITIONS[status];

  if (transitions.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        {t('statusActions.noTransitions', {
          status: t(`status.${status}`).toLowerCase(),
        })}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <form action={formAction} className="flex flex-wrap gap-2">
        <input type="hidden" name="id" value={orderId} />
        {transitions.map((target) => (
          <TransitionButton key={target} target={target} />
        ))}
      </form>
    </div>
  );
}
