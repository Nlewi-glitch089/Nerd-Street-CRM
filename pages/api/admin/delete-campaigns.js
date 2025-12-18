import { getUserFromToken } from '../../../lib/auth'
import { PrismaClient } from '@prisma/client'

let prisma
if (!global.__prisma) global.__prisma = new PrismaClient()
prisma = global.__prisma

// POST { password, names: ['Name A','Name B'] }
// Deletes campaigns with those exact names (and their donations).
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = req.headers.authorization || ''
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing authorization token' })

  const actor = await getUserFromToken(token)
  if (!actor) return res.status(401).json({ error: 'Invalid or expired token' })
  if (actor.role !== 'ADMIN') return res.status(403).json({ error: 'Admin role required' })

  const { password, names } = req.body || {}
  if (!password) return res.status(400).json({ error: 'Password required' })
  if (password !== actor.password) return res.status(403).json({ error: 'Password incorrect' })
  if (!Array.isArray(names) || names.length === 0) return res.status(400).json({ error: 'names array required' })

  const results = []
  try {
    for (const nameRaw of names) {
      const name = String(nameRaw || '').trim()
      if (!name) { results.push({ name, error: 'Invalid name' }); continue }
      const found = await prisma.campaign.findMany({ where: { name } })
      if (!found || found.length === 0) { results.push({ name, deleted: 0 }); continue }
      let deletedCount = 0
      for (const c of found) {
        // delete donations first
        const delD = await prisma.donation.deleteMany({ where: { campaignId: c.id } })
        // delete campaign
        await prisma.campaign.delete({ where: { id: c.id } })
        deletedCount += 1
      }
      results.push({ name, deleted: deletedCount })
    }
    return res.status(200).json({ ok: true, results })
  } catch (err) {
    console.error('Delete campaigns error', err)
    return res.status(500).json({ error: 'Delete failed', details: String(err) })
  }
}
