require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function run() {
  const inactive = await prisma.donor.findMany({ where: { active: false } })
  // normalize deletedAt for sorting: null -> far future
  const sorted = inactive.sort((a,b)=>{
    const ta = a.deletedAt ? new Date(a.deletedAt).getTime() : Infinity
    const tb = b.deletedAt ? new Date(b.deletedAt).getTime() : Infinity
    return ta - tb
  })
  const toKeep = sorted.slice(0,3)
  const toReactivate = sorted.slice(3)
  const reactivated = []
  for (const d of toReactivate) {
    await prisma.donor.update({ where: { id: d.id }, data: { active: true, deletedAt: null, deletedBy: null } })
    reactivated.push({ id: d.id, email: d.email })
  }
  const final = await prisma.donor.findMany({ where: { active: false }, orderBy: [{ deletedAt: 'asc' }], select: { id: true, email: true, deletedAt: true } })
  console.log('Reactivated count:', reactivated.length)
  console.log('Reactivated:', reactivated)
  console.log('Final inactive (should be 3):', final)
  await prisma.$disconnect()
}

run().catch(e=>{ console.error(e); process.exit(2) })
