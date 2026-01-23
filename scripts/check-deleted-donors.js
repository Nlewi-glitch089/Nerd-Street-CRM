const { PrismaClient } = require('@prisma/client')
;(async ()=>{
  const p = new PrismaClient()
  try {
    const ds = await p.donor.findMany({ orderBy: { updatedAt: 'desc' }, take: 10 })
    ds.forEach(d => console.log(JSON.stringify({ id: d.id, email: d.email, active: d.active, deletedAt: d.deletedAt })))
  } catch (e) {
    console.error('ERROR', e)
    process.exit(2)
  } finally {
    await p.$disconnect()
  }
})()
