const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

async function main(){
  console.log('Deleting donors with email starting with "donor+"')
  const donationsBefore = await prisma.donation.count({ where: { donor: { email: { startsWith: 'donor+' } } } })
  console.log('Related donations to delete:', donationsBefore)
  if (donationsBefore > 0) {
    const delDonations = await prisma.donation.deleteMany({ where: { donor: { email: { startsWith: 'donor+' } } } })
    console.log('Deleted donations:', delDonations.count)
  }
  const result = await prisma.donor.deleteMany({ where: { email: { startsWith: 'donor+' } } })
  console.log('Deleted donors:', result.count)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
