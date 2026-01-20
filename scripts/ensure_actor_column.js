const { getPrisma } = require('../lib/prisma')
;(async ()=>{
  const prisma = getPrisma()
  try {
    await prisma.$executeRaw`ALTER TABLE "ActionLog" ADD COLUMN IF NOT EXISTS "actorName" TEXT;`
    console.log('SQL column ensured')
  } catch (e) {
    console.error('SQL error', e.message)
  } finally {
    await prisma.$disconnect()
    process.exit(0)
  }
})().catch(e=>{ console.error(e); process.exit(1) })
