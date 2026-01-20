import { getUserFromToken } from '../../lib/auth'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

let prisma
if (!global.__prisma) {
  global.__prisma = new PrismaClient()
}
prisma = global.__prisma

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = req.headers?.authorization || req.headers?.Authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing authorization token' })

  const user = await getUserFromToken(token)
  if (!user) return res.status(401).json({ error: 'Invalid or expired token' })
  if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin role required' })

  const { password } = req.body || {}
  if (!password) return res.status(400).json({ error: 'Password required to confirm clear' })

  const ok = await bcrypt.compare(String(password), user.password)
  if (!ok) return res.status(403).json({ error: 'Password incorrect' })

  try {
    // Delete donations first to avoid FK issues, then tasks, donors, campaigns
    const delDonations = await prisma.donation.deleteMany()
    const delTasks = await prisma.task.deleteMany()
    const delDonors = await prisma.donor.deleteMany()
    const delCampaigns = await prisma.campaign.deleteMany()

    return res.status(200).json({ ok: true, deleted: { donations: delDonations.count, tasks: delTasks.count, donors: delDonors.count, campaigns: delCampaigns.count } })
  } catch (err) {
    console.error('Clear API error', err)
    return res.status(500).json({ error: 'Clear operation failed', details: String(err) })
  }
}
