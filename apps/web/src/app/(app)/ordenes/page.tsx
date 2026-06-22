'use client';
import { useState } from 'react';
import { MediaUpload } from '@/components/MediaUpload';

export default function OrdenesPage() {
  const [orderId, setOrderId] = useState('');
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Órdenes de trabajo</h1>
      <section className="max-w-md space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Demo subida de media</h2>
        <input
          type="text"
          placeholder="Order ID"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="block w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
        />
        {orderId && <MediaUpload orderId={orderId} />}
      </section>
    </div>
  );
}
