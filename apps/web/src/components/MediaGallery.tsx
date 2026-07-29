'use client';
import { useEffect, useReducer, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { MediaAssetWithUrl } from '@/app/api/media/[orderId]/route';
import { MediaLightbox } from './MediaLightbox';

type State = { loading: boolean; error: string; assets: MediaAssetWithUrl[] };
type Action =
  | { type: 'start' }
  | { type: 'success'; assets: MediaAssetWithUrl[] }
  | { type: 'error'; error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'start':
      return { loading: true, error: '', assets: state.assets };
    case 'success':
      return { loading: false, error: '', assets: action.assets };
    case 'error':
      return { loading: false, error: action.error, assets: state.assets };
  }
}

export function MediaGallery({
  orderId,
  refreshKey = 0,
}: {
  orderId: string;
  refreshKey?: number;
}) {
  const t = useTranslations('media');
  const [{ loading, error, assets }, dispatch] = useReducer(reducer, {
    loading: true,
    error: '',
    assets: [],
  });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    dispatch({ type: 'start' });
    fetch(`/api/media/${orderId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<MediaAssetWithUrl[]>;
      })
      .then((data) => dispatch({ type: 'success', assets: data }))
      .catch((err: unknown) =>
        dispatch({
          type: 'error',
          error: err instanceof Error ? err.message : t('unknownError'),
        }),
      );
  }, [orderId, refreshKey, t]);

  if (loading) {
    return <p className="text-sm text-gray-500">{t('loading')}</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (assets.length === 0) {
    return <p className="text-sm text-gray-400">{t('empty')}</p>;
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
        {assets.map((asset, i) => (
          <li key={asset.id}>
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={t('openItem', { index: i + 1 })}
              className="group relative block aspect-square w-full cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
            >
              {asset.type === 'VIDEO' ? (
                <video
                  src={asset.url}
                  muted
                  preload="metadata"
                  className="h-full w-full bg-black object-cover"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={asset.url}
                  alt={t('photoAlt', { index: i + 1, total: assets.length })}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              )}
              <span
                aria-hidden="true"
                className="absolute inset-0 transition-colors group-hover:bg-black/20"
              />
              {asset.type === 'VIDEO' && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <polygon points="6 4 20 12 6 20" />
                    </svg>
                  </span>
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {openIndex !== null && (
        <MediaLightbox
          assets={assets}
          initialIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}
