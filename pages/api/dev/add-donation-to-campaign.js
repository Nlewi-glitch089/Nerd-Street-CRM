import { PrismaClient } from '@prisma/client'

let prisma
if (!global.__prisma) {
  global.__prisma = new PrismaClient()
}
prisma = global.__prisma

export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Forbidden in production' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { campaignName, amount } = req.body || {}
    const amt = Number(amount || 40000)
    if (!campaignName) return res.status(400).json({ error: 'campaignName required' })
    if (!amt || isNaN(amt) || amt <= 0) return res.status(400).json({ error: 'amount must be a positive number' })

    // find campaign by name
    const campaign = await prisma.campaigns.findFirst({ where: { name: campaignName } })
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' })

    // prefer an existing donor (nate.marshall) or create a lightweight donor for attribution
    let donor = await prisma.donor.findFirst({ where: { email: 'nate.marshall@example.com' } })
    if (!donor) {
      donor = await prisma.donor.create({ data: { firstName: 'Nate', lastName: 'Marshall', email: 'nate.marshall@example.com', totalGiving: 0 } })
    }

    const donation = await prisma.donation.create({ data: { donorId: donor.id, campaignId: campaign.id, amount: amt, date: new Date(), method: 'CARD' } })

    // recalc campaign totals
    const agg = await prisma.donation.aggregate({ where: { campaignId: campaign.id }, _sum: { amount: true } })
    const raised = agg._sum.amount || 0

    // mark campaign approved if it now has funds
    if (!campaign.approved && raised > 0) {
      try { await prisma.campaigns.update({ where: { id: campaign.id }, data: { approved: true } }) } catch (e) { console.warn('Failed to update campaign approved flag', e) }
    }

    return res.status(200).json({ ok: true, donation, campaign: { id: campaign.id, name: campaign.name, raised } })
  } catch (err) {
    console.error('Dev add donation error', err)
    return res.status(500).json({ error: 'Server error', details: String(err) })
  }
}
