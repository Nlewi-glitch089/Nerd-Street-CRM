import { getUserFromToken } from '../../../lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = global.__prisma || new PrismaClient()
if (!global.__prisma) global.__prisma = prisma

export default async function handler(req, res) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Missing donor id' })

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

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

    return res.status(200).json({ donor: { id: donor.id, firstName: donor.firstName, lastName: donor.lastName, email: donor.email, phone: donor.phone, city: donor.city, state: donor.state, zipcode: donor.zipcode, active: donor.active, notes: donor.notes, totalGiving: donor.totalGiving, lastGiftAt: donor.lastGiftAt }, donations })
  } catch (err) {
    console.error('Donor detail error', err)
    return res.status(500).json({ error: 'Server error', details: String(err) })
  }
}
