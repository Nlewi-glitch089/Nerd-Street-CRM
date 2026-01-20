import { getUserFromToken } from '../../../lib/auth'
import { getPrisma } from '../../../lib/prisma'
import summarizeData from '../../../lib/ai'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth
    const user = await getUserFromToken(token)
    if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' })

    const prisma = getPrisma()

    // basic dataset gathering — keep it lightweight
    const donors = await prisma.donor.findMany({ include: { donations: true }, take: 100 })
    const donations = await prisma.donation.findMany({ orderBy: { date: 'desc' }, take: 1000 })
    const campaigns = await prisma.campaigns.findMany({ include: { donations: true } })
    const users = await prisma.user.findMany({ take: 100 })

    const payload = { donors, donations, campaigns, users, filters: req.body?.filters || {} }

    const result = await summarizeData(payload, { filters: req.body?.filters || {} })

    return res.status(200).json({ ok: true, result })
  } catch (err) {
    console.error('decision-summary error', err)
    return res.status(500).json({ error: String(err) })
  }
}
