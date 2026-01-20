const { getPrisma } = require('../lib/prisma')
;(async ()=>{
  const prisma = getPrisma()
  console.log('Scanning actionLog entries without actorName...')
  const logs = await prisma.actionLog.findMany({ where: { actorName: null }, take: 1000 })
  console.log('Found', logs.length)
  let updated = 0
  for (const l of logs) {
    let actorName = null
    if (l.userId) {
      try {
        const u = await prisma.user.findUnique({ where: { id: l.userId } })
        if (u) actorName = u.name || u.email || u.id
      } catch (e) {}
    }
    if (!actorName && l.meta) {
      actorName = l.meta.actorName || l.meta.byName || l.meta.by || null
    }
    if (!actorName && l.userId) actorName = `admin (${String(l.userId).slice(0,8)})`
    if (!actorName) actorName = 'system'
    try {
      await prisma.actionLog.update({ where: { id: l.id }, data: { actorName } })
      updated++
    } catch (e) {
      console.error('Failed to update', l.id, e.message)
    }
  }
  console.log('Updated', updated, 'rows')
  process.exit(0)
})().catch(e=>{ console.error(e); process.exit(1) })
