'use client';
import { useState } from 'react';

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

export function MediaUpload({ orderId }: { orderId: string }) {
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setOk(false);
    try {
      setMsg('Solicitando URL prefirmada…');
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

      setMsg('Subiendo a S3…');
      const s3Res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!s3Res.ok) throw new Error(`S3 ${s3Res.status}: ${s3Res.statusText}`);

      setMsg('Registrando archivo…');
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
      setMsg('Archivo subido correctamente.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept={ACCEPTED}
        disabled={busy}
        onChange={handleChange}
        className="block text-sm"
      />
      {msg && (
        <p
          className={`text-sm font-mono ${ok ? 'text-green-700' : busy ? 'text-gray-600' : 'text-red-600'}`}
        >
          {msg}
        </p>
      )}
    </div>
  );
}
