/**
 * Setup ejecutado antes de cada archivo de tests e2e.
 * Carga variables de entorno desde .env y define defaults para tests.
 *
 * Para correr los tests:
 *   pnpm --filter backend test:e2e
 *
 * Requiere una base de datos PostgreSQL activa (la misma que dev está bien).
 * Los tests crean talleres únicos por sufijo aleatorio y los limpian en afterAll.
 */
const path = require('path');

try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch {
  // dotenv es opcional: en CI los vars se inyectan directamente
}

process.env.NODE_ENV = 'test';

// Defaults: solo se aplican si la var no está ya definida (p.ej. viene de .env o CI)
const defaults = {
  APP_ENV: 'dev',
  JWT_SECRET: 'e2e-test-jwt-secret-do-not-use-in-production',
  AWS_REGION: 'us-east-1',
  S3_BUCKET: 'test-bucket',
  AWS_ACCESS_KEY_ID: 'AKIATEST000000000000',
  AWS_SECRET_ACCESS_KEY: 'test-secret-access-key-e2e',
  // Postgres individual vars: sólo necesarias para pasar Joi; la conexión usa DATABASE_URL
  POSTGRES_USER: 'car_check',
  POSTGRES_PASSWORD: 'car_check',
  POSTGRES_DB: 'car_check',
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}
