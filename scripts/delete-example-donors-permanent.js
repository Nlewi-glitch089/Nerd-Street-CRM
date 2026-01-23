require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function run() {
  const emails = [
    'donor+1769104846701@example.com',
    'donor+1769092443404@example.com',
    'jane.donor@example.com'
  ]
  const summary = { deleted: [], notFound: [], errors: [] }

  for (const email of emails) {
    try {
      const donor = await prisma.donor.findUnique({ where: { email } })
      if (!donor) { summary.notFound.push(email); continue }
      // delete donations
      const delD = await prisma.donation.deleteMany({ where: { donorId: donor.id } })
      // delete tasks
      const delT = await prisma.task.deleteMany({ where: { donorId: donor.id } })
      // delete donor
      await prisma.donor.delete({ where: { id: donor.id } })
      summary.deleted.push({ email, donorId: donor.id, donationsDeleted: delD.count, tasksDeleted: delT.count })
    } catch (e) {
      summary.errors.push({ email, error: String(e) })
    }
  }

  // final verification
  const remaining = await prisma.donor.findMany({ where: { email: { in: emails } } })
  console.log('Summary:')
  console.log('Deleted:', JSON.stringify(summary.deleted, null, 2))
  console.log('NotFound:', summary.notFound)
  console.log('Errors:', JSON.stringify(summary.errors, null, 2))
  console.log('Remaining matching donors (should be empty):', remaining)

  await prisma.$disconnect()
}

run().catch(e => { console.error(e); process.exit(2) })
