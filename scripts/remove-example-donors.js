require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function run() {
  const emailsToRemove = [
    'donor+1769104846701@example.com',
    'donor+1769092443404@example.com',
    'jane.donor@example.com'
  ]
  const actor = 'script-remove-examples'
  const now = new Date()
  const results = { removed: [], alreadyRemoved: [], notFound: [], reactivated: [] }

  for (const email of emailsToRemove) {
    const donor = await prisma.donor.findUnique({ where: { email } })
    if (!donor) {
      results.notFound.push(email)
      continue
    }
    if (!donor.active) {
      results.alreadyRemoved.push(email)
      continue
    }
    await prisma.donor.update({ where: { id: donor.id }, data: { active: false, deletedAt: now, deletedBy: actor } })
    results.removed.push(email)
  }

  // ensure only 3 inactive donors remain
  const inactive = await prisma.donor.findMany({ where: { active: false }, orderBy: { deletedAt: 'asc' } })
  if (inactive.length > 3) {
    const keep = inactive.slice(0, 3) // keep oldest 3 as inactive
    const toReactivate = inactive.slice(3)
    for (const d of toReactivate) {
      await prisma.donor.update({ where: { id: d.id }, data: { active: true, deletedAt: null, deletedBy: null } })
      results.reactivated.push({ id: d.id, email: d.email })
    }
  }

  const finalInactive = await prisma.donor.count({ where: { active: false } })

  console.log('Summary:')
  console.log('Removed (soft-deleted):', results.removed)
  console.log('Already removed:', results.alreadyRemoved)
  console.log('Not found:', results.notFound)
  console.log('Reactivated to limit inactivity to 3:', results.reactivated)
  console.log('Final inactive count:', finalInactive)

  await prisma.$disconnect()
}

run().catch(e => { console.error(e); process.exit(2) })
