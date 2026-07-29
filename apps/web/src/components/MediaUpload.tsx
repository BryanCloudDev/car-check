'use client';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

const ACCEPTED = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
].join(',');

export function MediaUpload({
  orderId,
  onSuccess,
}: {
  orderId: string;
  onSuccess?: () => void;
}) {
  const t = useTranslations('media');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setOk(false);
    try {
      setMsg(t('upload.requestingUrl'));
      const urlRes = await fetch(`/api/media/${orderId}/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type, sizeBytes: file.size }),
      });
      if (!urlRes.ok) {
        const json = await urlRes.json().catch(() => ({}));
        throw new Error(
          (json as { error?: string }).error ?? `HTTP ${urlRes.status}`,
        );
      }
      const { uploadUrl, key } = (await urlRes.json()) as {
        uploadUrl: string;
        key: string;
      };

      setMsg(t('upload.uploading'));
      const s3Res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!s3Res.ok) throw new Error(`S3 ${s3Res.status}: ${s3Res.statusText}`);

      setMsg(t('upload.registering'));
      const confirmRes = await fetch(`/api/media/${orderId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          contentType: file.type,
          sizeBytes: file.size,
        }),
      });
      if (!confirmRes.ok) {
        const json = await confirmRes.json().catch(() => ({}));
        throw new Error(
          (json as { error?: string }).error ??
            `Confirm HTTP ${confirmRes.status}`,
        );
      }

      setOk(true);
      setMsg(t('upload.success'));
      onSuccess?.();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('unknownError'));
    } finally {
      setBusy(false);
      // reset so the same file can be re-selected after an error
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        disabled={busy}
        onChange={handleChange}
        className="sr-only"
        id={`media-upload-${orderId}`}
      />
      <label
        htmlFor={`media-upload-${orderId}`}
        className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors
          ${
            busy
              ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100'
          }`}
      >
        {busy ? (
          <svg
            className="h-4 w-4 animate-spin text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        ) : (
          <svg
            className="h-4 w-4 text-gray-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        )}
        {busy ? msg : t('upload.button')}
      </label>

      {!busy && msg && (
        <p className={`text-sm ${ok ? 'text-green-700' : 'text-red-600'}`}>
          {ok ? '✓ ' : '⚠ '}
          {msg}
        </p>
      )}
    </div>
  );
}
