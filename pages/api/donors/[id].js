import { getUserFromToken } from '../../../lib/auth'
import { getPrisma } from '../../../lib/prisma'

const prisma = getPrisma()

export default async function handler(req, res) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Missing donor id' })

  if (!['GET','PUT','DELETE'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' })

  try {
    const auth = req.headers.authorization
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
    const actor = token ? await getUserFromToken(token) : null
    if (!actor) return res.status(401).json({ error: 'Unauthorized' })
    // allow ADMIN and TEAM_MEMBER to view donor details
    if (!['ADMIN','TEAM_MEMBER'].includes(actor.role)) return res.status(403).json({ error: 'Insufficient permissions' })

    const donor = await prisma.donor.findUnique({
      where: { id: String(id) },
      include: { donations: { orderBy: { date: 'desc' } } }
    })
    if (!donor) return res.status(404).json({ error: 'Donor not found' })

    // format donations for client (include method + notes)
    const donations = (donor.donations || []).map(d => ({ id: d.id, amount: d.amount, date: d.date, campaignId: d.campaignId, method: d.method || null, notes: d.notes || null }))

    if (req.method === 'GET') {
      return res.status(200).json({ donor: { id: donor.id, firstName: donor.firstName, lastName: donor.lastName, email: donor.email, phone: donor.phone, city: donor.city, state: donor.state, zipcode: donor.zipcode, active: donor.active, notes: donor.notes, totalGiving: donor.totalGiving, lastGiftAt: donor.lastGiftAt }, donations })
    }

    // require admin or team member for updates
    if (req.method === 'PUT') {
      if (!['ADMIN','TEAM_MEMBER'].includes(actor.role)) return res.status(403).json({ error: 'Insufficient permissions' })
      const { firstName, lastName, email, phone, notes, city, state, zipcode, active } = req.body || {}
      const data = {}
      if (firstName != null) data.firstName = firstName
      if (lastName != null) data.lastName = lastName
      if (email != null) data.email = email
      if (phone != null) data.phone = phone
      if (notes != null) data.notes = notes
      if (city != null) data.city = city
      if (state != null) data.state = state
      if (zipcode != null) data.zipcode = zipcode
      if (active != null) data.active = !!active
      const updated = await prisma.donor.update({ where: { id: String(id) }, data })
      try { await prisma.actionLog.create({ data: { action: 'update', targetType: 'donor', targetId: updated.id, userId: actor.id, actorName: actor.name || actor.email || actor.id, meta: data } }) } catch (e) {}
      return res.status(200).json({ donor: { id: updated.id, firstName: updated.firstName, lastName: updated.lastName, email: updated.email, phone: updated.phone, active: updated.active, totalGiving: updated.totalGiving } })
    }

    if (req.method === 'DELETE') {
      if (actor.role !== 'ADMIN') return res.status(403).json({ error: 'Admin required' })
      const now = new Date()
      const updated = await prisma.donor.update({ where: { id: String(id) }, data: { active: false, deletedAt: now, deletedBy: actor.id } })
      try { await prisma.actionLog.create({ data: { action: 'delete', targetType: 'donor', targetId: updated.id, userId: actor.id, actorName: actor.name || actor.email || actor.id, meta: { deletedAt: now } } }) } catch (e) {}
      return res.status(200).json({ ok: true })
    }
  } catch (err) {
    console.error('Donor detail error', err)
    return res.status(500).json({ error: 'Server error', details: String(err) })
  }
}
