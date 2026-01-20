const { getPrisma } = require('../lib/prisma')
;(async ()=>{
  const prisma = getPrisma()
  const logs = await prisma.actionLog.findMany({ orderBy: { createdAt: 'desc' }, take: 30 })
  const userIds = Array.from(new Set(logs.map(l => l.userId).filter(Boolean)))
  const users = userIds.length ? await prisma.user.findMany({ where: { id: { in: userIds } } }) : []
  const userMap = users.reduce((acc,u)=>{ acc[u.id] = { id: u.id, name: u.name, email: u.email }; return acc }, {})

  for (const l of logs) {
    let targetName = null
    let actorName = null
    if (l.userId && userMap[l.userId]) actorName = userMap[l.userId].name || userMap[l.userId].email || userMap[l.userId].id
    if (!actorName && l.meta) actorName = l.meta.actorName || l.meta.byName || l.meta.by || null
    if (!actorName && l.userId) actorName = `admin (${String(l.userId).slice(0,8)})`

    if ((!l.meta || !(l.meta.name || l.meta.title)) && l.targetType) {
      const t = String(l.targetType).toLowerCase()
      try {
        if (t === 'campaign') {
          const c = await prisma.campaigns.findUnique({ where: { id: String(l.targetId) } })
          if (c) targetName = c.name
        } else if (t === 'donor') {
          const d = await prisma.donor.findUnique({ where: { id: String(l.targetId) } })
          if (d) targetName = `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.email || d.id
        } else if (t === 'event') {
          const e = await prisma.event.findUnique({ where: { id: String(l.targetId) } })
          if (e) targetName = e.title
        } else if (t === 'user') {
          const u = await prisma.user.findUnique({ where: { id: String(l.targetId) } })
          if (u) targetName = u.name || u.email || u.id
        }
      } catch (e) {}
    }

    const friendlyMetaName = (l.meta && (l.meta.name || l.meta.title))
    const friendlyTarget = l.targetName || friendlyMetaName || (l.meta && l.meta.deletedAt ? `${l.targetId} (deleted ${new Date(l.meta.deletedAt).toLocaleString()})` : l.targetId)
    const verbMap = { create: 'created', update: 'updated', delete: 'deleted', approve: 'approved', deactivate: 'deactivated', deny: 'denied' }
    const verb = verbMap[l.action] || l.action
    const actor = l.user ? (l.user && (l.user.name || l.user.email || l.user.id)) : (actorName || 'system')

    console.log(`${actor} ${verb} ${String(l.targetType).toLowerCase()} ${friendlyTarget}`)
  }
  process.exit(0)
})().catch(e=>{ console.error(e); process.exit(1) })
