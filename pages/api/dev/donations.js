import { PrismaClient } from '@prisma/client'

let prisma
if (!global.__prisma) {
  global.__prisma = new PrismaClient()
}
prisma = global.__prisma

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const allowInProd = (() => {
    try {
      if (process.env.NODE_ENV !== 'production') return true
      const provided = req.headers['x-debug-key'] || req.headers['x-debug-key'.toUpperCase()]
      if (process.env.DEBUG_KEY && provided && String(provided) === String(process.env.DEBUG_KEY)) return true
      return false
    } catch (e) { return false }
  })()

  if (!allowInProd) return res.status(403).json({ error: 'Debug endpoint disabled in production (missing DEBUG_KEY)' })

  try {
    const donations = await prisma.donation.findMany({ orderBy: { date: 'desc' }, take: 1000 })
    const totalRevenue = donations.reduce((s, d) => s + (Number(d.amount || 0) || 0), 0)
    const count = donations.length
    return res.status(200).json({ ok: true, count, totalRevenue, donations })
  } catch (err) {
    console.error('Dev donations error', err)
    return res.status(500).json({ error: 'Failed to fetch donations', details: String(err && err.message ? err.message : err) })
  }
}
