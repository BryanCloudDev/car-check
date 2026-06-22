/** VIN: 17 alfanuméricos, excluye I, O, Q (ISO 3779) */
export const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

/** Prisma error codes — https://www.prisma.io/docs/orm/reference/error-reference */
export const PrismaErrorCode = {
  /** Record not found (findFirstOrThrow, update, delete on missing id) */
  NOT_FOUND: 'P2025',
  /** Unique constraint violation */
  UNIQUE_VIOLATION: 'P2002',
} as const;
