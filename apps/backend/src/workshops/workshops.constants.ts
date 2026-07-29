/**
 * El logo va embebido en el PDF del recibo, así que sólo se aceptan formatos
 * que PDFKit sabe dibujar (`doc.image` soporta PNG y JPEG únicamente).
 */
export const ALLOWED_LOGO_TYPES: string[] = ['image/png', 'image/jpeg'];

/** Un logo no necesita más que esto; mantenerlo chico agiliza el PDF. */
export const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB

export const WORKSHOP_FIELD_LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 120,
  ADDRESS_MAX: 200,
  /** NIT salvadoreño: 14 dígitos con guiones = 17 caracteres. */
  NIT_MAX: 20,
  PHONE_MIN: 7,
  PHONE_MAX: 25,
} as const;
