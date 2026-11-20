import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

try {
  await prisma.configuracion.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      valorHoraEstandar: new Prisma.Decimal('0'),
      diasAlertaRiesgo: 3,
      porcentajeAvanceRiesgo: 80,
      etapasDefault: ['Corte', 'Soldadura', 'Mecanizado', 'Pintura', 'Entrega'],
    },
    update: {},
  });
} finally {
  await prisma.$disconnect();
}
