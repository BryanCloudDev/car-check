'use client';
import { useState } from 'react';
import { MediaUpload } from './MediaUpload';
import { MediaGallery } from './MediaGallery';

export function MediaSection({ orderId }: { orderId: string }) {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <>
      <MediaUpload
        orderId={orderId}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
      <div className="mt-4">
        <MediaGallery orderId={orderId} refreshKey={refreshKey} />
      </div>
    </>
  );
}
