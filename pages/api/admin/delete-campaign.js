import { getUserFromToken } from '../../../lib/auth'
import { PrismaClient } from '@prisma/client'

let prisma
if (!global.__prisma) global.__prisma = new PrismaClient()
prisma = global.__prisma

// POST { password, id }
// Deletes a single campaign by id (and its donations). Admin only.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = req.headers.authorization || ''
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing authorization token' })

  const actor = await getUserFromToken(token)
  if (!actor) return res.status(401).json({ error: 'Invalid or expired token' })
  if (actor.role !== 'ADMIN') return res.status(403).json({ error: 'Admin role required' })

  const { password, id } = req.body || {}
  if (!password) return res.status(400).json({ error: 'Password required' })
  if (password !== actor.password) return res.status(403).json({ error: 'Password incorrect' })
  if (!id) return res.status(400).json({ error: 'Campaign id required' })

  try {
    // delete donations first
    await prisma.donation.deleteMany({ where: { campaignId: String(id) } })
    // delete campaign
    await prisma.campaign.delete({ where: { id: String(id) } })
    return res.status(200).json({ ok: true, deletedId: id })
  } catch (err) {
    console.error('Delete campaign by id error', err)
    return res.status(500).json({ error: 'Delete failed', details: String(err) })
  }
}
