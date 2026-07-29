'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import type { MediaAssetWithUrl } from '@/app/api/media/[orderId]/route';

const SWIPE_THRESHOLD_PX = 50;

/** Full-screen viewer with keyboard, swipe and thumbnail navigation. */
export function MediaLightbox({
  assets,
  initialIndex,
  onClose,
}: {
  assets: MediaAssetWithUrl[];
  initialIndex: number;
  onClose: () => void;
}) {
  const t = useTranslations('media');
  const [index, setIndex] = useState(initialIndex);
  const [loadedKeys, setLoadedKeys] = useState<Record<string, true>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const activeThumbRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const total = assets.length;
  const asset = assets[index];
  const hasSiblings = total > 1;

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + total) % total),
    [total],
  );

  // Move focus into the dialog and give it back to the trigger on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    containerRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, []);

  // The page behind the overlay must not scroll.
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (hasSiblings) go(-1);
          break;
        case 'ArrowRight':
          if (hasSiblings) go(1);
          break;
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [go, hasSiblings, onClose]);

  // Warm up the neighbours so stepping through feels instant.
  useEffect(() => {
    for (const delta of [1, -1]) {
      const neighbour = assets[(index + delta + total) % total];
      if (neighbour && neighbour.type === 'IMAGEN') {
        const img = new Image();
        img.src = neighbour.url;
      }
    }
  }, [assets, index, total]);

  useEffect(() => {
    activeThumbRef.current?.scrollIntoView({
      block: 'nearest',
      inline: 'center',
    });
  }, [index]);

  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    const touch = e.changedTouches[0];
    touchStart.current = null;
    if (!start || !touch || !hasSiblings) return;

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    // Ignore mostly-vertical drags so they don't fight with the thumb strip.
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) <= Math.abs(dy)) {
      return;
    }
    go(dx < 0 ? 1 : -1);
  }

  // Only ever mounted from a click, so `document` is available by then.
  if (typeof document === 'undefined' || !asset) return null;

  const isLoaded = loadedKeys[asset.id] === true;

  return createPortal(
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={t('viewerLabel')}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col bg-black/95 outline-none backdrop-blur-sm"
    >
      <header className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3">
        <p className="text-sm font-medium tabular-nums text-white/70">
          {t('counter', { index: index + 1, total })}
        </p>
        <div className="flex items-center gap-1">
          <a
            href={asset.url}
            target="_blank"
            rel="noopener noreferrer"
            title={t('openOriginal')}
            aria-label={t('openOriginal')}
            className="rounded-full p-2.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
          <button
            type="button"
            onClick={onClose}
            title={t('close')}
            aria-label={t('close')}
            className="rounded-full p-2.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* Stage — clicking the empty space around the media closes the viewer. */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-2 sm:px-4"
        onClick={onClose}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {asset.type === 'VIDEO' ? (
          <video
            key={asset.id}
            src={asset.url}
            controls
            autoPlay
            playsInline
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-lg bg-black"
          />
        ) : (
          <>
            {!isLoaded && (
              <span
                aria-hidden="true"
                className="absolute h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/70"
              />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={asset.id}
              src={asset.url}
              alt={t('photoAlt', { index: index + 1, total })}
              draggable={false}
              onLoad={() =>
                setLoadedKeys((prev) => ({ ...prev, [asset.id]: true }))
              }
              onClick={(e) => e.stopPropagation()}
              className={`max-h-full max-w-full select-none object-contain transition-opacity duration-200 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        )}

        {hasSiblings && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              title={t('previous')}
              aria-label={t('previous')}
              className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white/80 transition-colors hover:bg-black/70 hover:text-white sm:left-4 sm:p-3"
            >
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              title={t('next')}
              aria-label={t('next')}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white/80 transition-colors hover:bg-black/70 hover:text-white sm:right-4 sm:p-3"
            >
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {hasSiblings && (
        <nav
          aria-label={t('thumbnails')}
          className="flex shrink-0 gap-2 overflow-x-auto px-3 pb-3 sm:px-4 sm:pb-4"
        >
          {assets.map((item, i) => (
            <button
              key={item.id}
              ref={i === index ? activeThumbRef : undefined}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={t('goTo', { index: i + 1 })}
              aria-current={i === index}
              className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition-opacity sm:h-16 sm:w-16 ${
                i === index
                  ? 'border-white opacity-100'
                  : 'border-transparent opacity-50 hover:opacity-90'
              }`}
            >
              {item.type === 'VIDEO' ? (
                <>
                  <video
                    src={item.url}
                    muted
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <polygon points="6 4 20 12 6 20" />
                    </svg>
                  </span>
                </>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={item.url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              )}
            </button>
          ))}
        </nav>
      )}
    </div>,
    document.body,
  );
}
