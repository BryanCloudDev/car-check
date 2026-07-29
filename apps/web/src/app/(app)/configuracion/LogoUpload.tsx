'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { removeLogoAction } from './actions';

/** El backend sólo acepta PNG/JPEG: son los formatos que PDFKit puede embeber. */
const ACCEPTED = ['image/png', 'image/jpeg'].join(',');
const MAX_BYTES = 2 * 1024 * 1024;

export function LogoUpload({ logoUrl }: { logoUrl: string | null }) {
  const t = useTranslations('configuracion.logo');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [removing, startRemoving] = useTransition();

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    if (file.size > MAX_BYTES) {
      setError(t('tooLarge'));
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setBusy(true);
    try {
      setStatus(t('requestingUrl'));
      const urlRes = await fetch('/api/workshop/logo/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type, sizeBytes: file.size }),
      });
      if (!urlRes.ok) throw new Error(await readError(urlRes));
      const { uploadUrl, key } = (await urlRes.json()) as {
        uploadUrl: string;
        key: string;
      };

      setStatus(t('uploading'));
      const s3Res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!s3Res.ok) throw new Error(`S3 ${s3Res.status}: ${s3Res.statusText}`);

      setStatus(t('registering'));
      const confirmRes = await fetch('/api/workshop/logo/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      if (!confirmRes.ok) throw new Error(await readError(confirmRes));

      setStatus('');
      router.refresh();
    } catch (err) {
      setStatus('');
      setError(err instanceof Error ? err.message : t('failed'));
    } finally {
      setBusy(false);
      // permite volver a elegir el mismo archivo tras un error
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleRemove() {
    setError('');
    startRemoving(async () => {
      const result = await removeLogoAction();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const disabled = busy || removing;

  return (
    <div className="space-y-3">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-600">
        {t('label')}
      </span>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-20 w-32 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50">
          {logoUrl ? (
            /* URL pre-firmada de S3: va como <img> plano, igual que la galería. */
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logoUrl}
              alt={t('alt')}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="px-2 text-center text-xs text-gray-400">
              {t('none')}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              id="workshop-logo"
              type="file"
              accept={ACCEPTED}
              disabled={disabled}
              onChange={handleChange}
              className="sr-only"
            />
            <label
              htmlFor="workshop-logo"
              className={`inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                disabled
                  ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                  : 'cursor-pointer border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              {busy ? status : logoUrl ? t('replace') : t('upload')}
            </label>

            {logoUrl && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {removing ? t('removing') : t('remove')}
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500">{t('hint')}</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">⚠ {error}</p>}
    </div>
  );
}

async function readError(res: Response): Promise<string> {
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  return json.error ?? `HTTP ${res.status}`;
}
