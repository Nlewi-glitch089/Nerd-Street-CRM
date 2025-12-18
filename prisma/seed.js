// Seed script for Prisma - creates sample user, donor, donation
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main(){
  console.log('Seeding database...');

  const bcrypt = require('bcryptjs')
  const hashed = await bcrypt.hash('password', 10)
  const user = await prisma.user.upsert({
    where: { email: 'admin@nerdstreet.org' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@nerdstreet.org',
      password: hashed,
      role: 'ADMIN'
    }
  });

  const donor = await prisma.donor.upsert({
    where: { email: 'jane.donor@example.com' },
    update: {},
    create: {
      firstName: 'Jane',
      lastName: 'Donor',
      email: 'jane.donor@example.com',
      phone: null,
      notes: 'Seed donor',
      totalGiving: 100.0
    }
  });

  await prisma.donation.create({
    data: {
      donorId: donor.id,
      amount: 100.0,
      method: 'credit_card'
    }
  });

  console.log('Seeding complete.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async ()=>{ await prisma.$disconnect(); });
