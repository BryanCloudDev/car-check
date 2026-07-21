'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';
import { setLocale } from '@/i18n/actions';

export function LanguageSelector() {
  const t = useTranslations('language');
  const current = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(locale: Locale) {
    if (locale === current) return;
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-1" role="group" aria-label={t('label')}>
      {locales.map((locale) => {
        const active = locale === current;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => onChange(locale)}
            disabled={pending}
            aria-current={active ? 'true' : undefined}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm transition-colors disabled:opacity-60 ${
              active
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            {t(locale)}
          </button>
        );
      })}
    </div>
  );
}
