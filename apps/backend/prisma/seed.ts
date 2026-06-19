import { PrismaClient } from '../generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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

  const passwordHash = await bcrypt.hash('admin123', 10);

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

  console.log('Seeded workshop:', workshop.name);
  console.log('Seeded user:', user.email, '— role:', user.role);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
