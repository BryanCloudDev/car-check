import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const workshop = await prisma.workshop.upsert({
    where: { email: 'demo@tallercheck.sv' },
    update: {},
    create: {
      name: 'Taller Demo',
      email: 'demo@tallercheck.sv',
      phone: '+503 7000-0000',
    },
  });

  // Local dev keeps the well-known password; production passes a real one in.
  const passwordHash = await bcrypt.hash(
    process.env.SEED_ADMIN_PASSWORD ?? 'admin123',
    10,
  );

  const user = await prisma.user.upsert({
    where: { email: 'admin@tallercheck.sv' },
    update: {},
    create: {
      name: 'Admin Demo',
      email: 'admin@tallercheck.sv',
      passwordHash,
      role: 'ADMIN',
      workshopId: workshop.id,
    },
  });

  // Customer has no natural unique key, so pin the id to keep this idempotent.
  const customer = await prisma.customer.upsert({
    where: { id: 'seed-customer-demo' },
    update: {},
    create: {
      id: 'seed-customer-demo',
      name: 'Cliente Demo',
      phone: '+503 7000-0001',
      email: 'cliente@tallercheck.sv',
      workshopId: workshop.id,
    },
  });

  console.log('Seeded workshop:', workshop.name);
  console.log('Seeded user:', user.email, '— role:', user.role);
  console.log('Seeded customer:', customer.name, '—', customer.phone);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
