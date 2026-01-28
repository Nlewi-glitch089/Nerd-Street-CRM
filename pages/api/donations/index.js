import { getUserFromToken } from '../../../lib/auth'
import { getPrisma } from '../../../lib/prisma'

const prisma = getPrisma()

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const auth = req.headers.authorization
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
    const actor = token ? await getUserFromToken(token) : null
    if (!actor) return res.status(401).json({ error: 'Unauthorized' })

    const { donorId, amount, campaignId, date, method, notes } = req.body || {}
    if (!donorId || !amount) return res.status(400).json({ error: 'donorId and amount required' })

    // sanitize inputs minimally - do NOT accept or store raw sensitive card details in production
    const cleanMethod = method ? String(method).toUpperCase() : null
    const cleanNotes = notes ? String(notes) : null

    // create donation (stores method and optional notes)
    const donation = await prisma.donation.create({ data: { donorId: String(donorId), amount: parseFloat(amount), campaignId: campaignId ? String(campaignId) : null, date: date ? new Date(date) : new Date(), method: cleanMethod, notes: cleanNotes } })

    // update donor totals
    const donor = await prisma.donor.findUnique({ where: { id: String(donorId) } })
    if (donor) {
      const newTotal = (parseFloat(donor.totalGiving || 0) + parseFloat(amount))
      await prisma.donor.update({ where: { id: String(donorId) }, data: { totalGiving: newTotal, lastGiftAt: new Date() } })
    }

    return res.status(201).json({ donation })
  } catch (err) {
    console.error('Create donation error', err)
    return res.status(500).json({ error: 'Server error', details: String(err) })
  }
}
