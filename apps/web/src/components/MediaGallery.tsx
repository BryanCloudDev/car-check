'use client';
import { useEffect, useReducer } from 'react';
import type { MediaAssetWithUrl } from '@/app/api/media/[orderId]/route';

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
  const [{ loading, error, assets }, dispatch] = useReducer(reducer, {
    loading: true,
    error: '',
    assets: [],
  });

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
          error: err instanceof Error ? err.message : 'Error desconocido',
        }),
      );
  }, [orderId, refreshKey]);

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando archivos…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (assets.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        Aún no hay fotos ni videos en esta orden.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {assets.map((asset) =>
        asset.type === 'VIDEO' ? (
          <video
            key={asset.id}
            src={asset.url}
            controls
            className="w-full rounded-lg border border-gray-200 bg-black"
          />
        ) : (
          <a
            key={asset.id}
            href={asset.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.url}
              alt="Foto de la orden"
              className="aspect-square w-full rounded-lg border border-gray-200 object-cover transition-opacity hover:opacity-80"
            />
          </a>
        ),
      )}
    </div>
  );
}
