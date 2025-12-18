import { getUserFromToken } from '../../../lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = global.__prisma || new PrismaClient()
if (!global.__prisma) global.__prisma = prisma

export default async function handler(req, res) {
  const auth = req.headers.authorization
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
  const actor = token ? await getUserFromToken(token) : null

  if (!actor) return res.status(401).json({ error: 'Unauthorized' })
  if (!['ADMIN','TEAM_MEMBER'].includes(actor.role)) return res.status(403).json({ error: 'Insufficient permissions' })

  try {
    if (req.method === 'GET') {
      const list = await prisma.donor.findMany({ orderBy: { lastGiftAt: 'desc' } })
      const out = list.map(d => ({ id: d.id, firstName: d.firstName, lastName: d.lastName, email: d.email, phone: d.phone, city: d.city, state: d.state, zipcode: d.zipcode, active: d.active, totalGiving: d.totalGiving, lastGiftAt: d.lastGiftAt }))
      return res.status(200).json({ donors: out })
    }

    if (req.method === 'POST') {
      const { firstName, lastName, email, phone, notes, city, state, zipcode, active } = req.body || {}
      if (!firstName || !email) return res.status(400).json({ error: 'firstName and email required' })
      const created = await prisma.donor.create({ data: { firstName, lastName, email, phone, notes, city, state, zipcode, active: typeof active === 'boolean' ? active : true } })
      return res.status(201).json({ donor: { id: created.id, firstName: created.firstName, lastName: created.lastName, email: created.email, phone: created.phone, city: created.city, state: created.state, zipcode: created.zipcode, active: created.active, totalGiving: created.totalGiving } })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Donors API error', err)
    return res.status(500).json({ error: 'Server error', details: String(err) })
  }
}
