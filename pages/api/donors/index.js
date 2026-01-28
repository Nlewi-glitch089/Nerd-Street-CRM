import { getUserFromToken } from '../../../lib/auth'
import { getPrisma } from '../../../lib/prisma'

const prisma = getPrisma()

export default async function handler(req, res) {
  const auth = req.headers.authorization
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
  let actor = null
  if (token) {
    try {
      actor = await getUserFromToken(token)
    } catch (err) {
      console.error('Auth lookup failed', err)
      return res.status(500).json({ error: 'Auth lookup failed', details: String(err && err.message ? err.message : err) })
    }
  }

  if (!actor) return res.status(401).json({ error: 'Unauthorized' })
  if (!['ADMIN','TEAM_MEMBER'].includes(actor.role)) return res.status(403).json({ error: 'Insufficient permissions' })

  try {
    if (req.method === 'GET') {
      const q = (req.query && (req.query.q || req.query.search)) ? String(req.query.q || req.query.search) : null
      const excludeInactiveDays = req.query && req.query.excludeInactiveDays ? parseInt(String(req.query.excludeInactiveDays), 10) : null
      const page = parseInt(String(req.query.page || '1'), 10) || 1
      const pageSize = Math.min(parseInt(String(req.query.pageSize || '25'), 10) || 25, 200)
      const take = pageSize
      const skip = Math.max(0, (page - 1) * pageSize)
      let cutoff = null
      if (typeof excludeInactiveDays === 'number' && !Number.isNaN(excludeInactiveDays) && excludeInactiveDays > 0) {
        cutoff = new Date(Date.now() - (excludeInactiveDays * 24 * 60 * 60 * 1000))
      }
      if (q && q.trim() !== '') {
        const qnorm = q.trim()
        const useStarts = qnorm.length === 1
        const build = (field) => useStarts ? { [field]: { startsWith: qnorm, mode: 'insensitive' } } : { [field]: { contains: qnorm, mode: 'insensitive' } }
        let where = { OR: [ build('firstName'), build('lastName'), build('email') ] }
        if (cutoff) {
          // restrict to donors with lastGiftAt on/after cutoff (null lastGiftAt will be excluded)
          where = { AND: [ where, { lastGiftAt: { gte: cutoff } } ] }
        }
        const [list, total] = await Promise.all([
          prisma.donor.findMany({ where, orderBy: { lastGiftAt: 'desc' }, skip, take, include: { _count: { select: { donations: true } } } }),
          prisma.donor.count({ where })
        ])
        const out = list.map(d => ({ id: d.id, firstName: d.firstName, lastName: d.lastName, email: d.email, phone: d.phone, active: d.active, totalGiving: d.totalGiving, lastGiftAt: d.lastGiftAt, donationCount: (d._count && d._count.donations) || 0 }))
        return res.status(200).json({ donors: out, q: qnorm, page, pageSize, total })
      }
      let whereAll = undefined
      if (cutoff) {
        whereAll = { lastGiftAt: { gte: cutoff } }
      }
      const [list, total] = await Promise.all([
        prisma.donor.findMany({ where: whereAll, orderBy: { lastGiftAt: 'desc' }, skip, take, include: { _count: { select: { donations: true } } } }),
        typeof whereAll !== 'undefined' ? prisma.donor.count({ where: whereAll }) : prisma.donor.count()
      ])
      const out = list.map(d => ({ id: d.id, firstName: d.firstName, lastName: d.lastName, email: d.email, phone: d.phone, active: d.active, totalGiving: d.totalGiving, lastGiftAt: d.lastGiftAt, donationCount: (d._count && d._count.donations) || 0 }))
      return res.status(200).json({ donors: out, page, pageSize, total })
    }

    if (req.method === 'POST') {
      const { firstName, lastName, email, phone, notes, active, initialAmount, initialCampaignId, initialDate, initialMethod, initialNotes } = req.body || {}
      console.log('POST /api/donors called by', actor?.email || actor?.id || 'anonymous', 'body:', { firstName, lastName, email, phone, initialAmount })
      if (!firstName || !email) return res.status(400).json({ error: 'firstName and email required' })
      try {
        // Create donor and optional initial donation in a single transaction when provided
        const result = await prisma.$transaction(async (tx) => {
          const created = await tx.donor.create({ data: { firstName, lastName, email, phone, notes, active: typeof active === 'boolean' ? active : true } })
          let donation = null
          if (initialAmount && !Number.isNaN(Number(initialAmount))) {
            const amt = parseFloat(initialAmount)
            const d = {
              donorId: created.id,
              amount: amt,
              campaignId: initialCampaignId ? String(initialCampaignId) : null,
              date: initialDate ? new Date(initialDate) : new Date(),
              method: initialMethod ? String(initialMethod) : null,
              notes: initialNotes ? String(initialNotes) : null
            }
            donation = await tx.donation.create({ data: d })
            try {
              await tx.donor.update({ where: { id: created.id }, data: { totalGiving: amt, lastGiftAt: donation.date } })
            } catch (u) { /* non-fatal */ }
          }
          return { created, donation }
        })

        const created = result.created
        console.log('Created donor', created.id, created.email)
        const out = { id: created.id, firstName: created.firstName, lastName: created.lastName, email: created.email, phone: created.phone, active: created.active, totalGiving: created.totalGiving }
        // include donation in response when created
        if (result.donation) out.initialDonation = { id: result.donation.id, amount: result.donation.amount, date: result.donation.date }
        return res.status(201).json({ donor: out })
      } catch (e) {
        console.error('Failed to create donor', e && e.message ? e.message : e)
        // Prisma unique constraint error code
        if (e && e.code === 'P2002') {
          return res.status(409).json({ error: 'Donor with that email already exists' })
        }
        return res.status(500).json({ error: 'Failed to create donor', details: String(e && e.message ? e.message : e) })
      }
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Donors API error', err)
    return res.status(500).json({ error: 'Server error', details: String(err) })
  }
}
