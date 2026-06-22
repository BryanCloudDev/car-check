export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
] as const;

export const ALLOWED_CONTENT_TYPES: string[] = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
];

export const MAX_BYTES = {
  IMAGE: 20 * 1024 * 1024, // 20 MB
  VIDEO: 200 * 1024 * 1024, // 200 MB
};

/** Seconds until the presigned PUT URL expires */
export const PRESIGNED_URL_EXPIRES_IN = 300; // 5 min
