export default function handler(req, res) {
  // Simple mock AI analysis endpoint.
  // Expects POST with { donors: [...], donations: [...] } and returns sample insights.
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = req.body || {}
  // basic aggregation (mock)
  const donors = Array.isArray(body.donors) ? body.donors : []
  const donations = Array.isArray(body.donations) ? body.donations : []

  const totalDonors = donors.length
  const totalDonations = donations.length
  const totalAmount = donations.reduce((s,d) => s + (Number(d.amount) || 0), 0)

  // sample risk detection: donors with no donation in last 365 days
  const now = Date.now()
  const riskDonors = donors.filter(d => {
    const last = d.lastDonationDate ? new Date(d.lastDonationDate).getTime() : 0
    return (now - last) > (365 * 24 * 60 * 60 * 1000)
  }).slice(0,5)

  // suggested actions (mock)
  const suggestions = [
    { text: 'Prioritize outreach to at-risk donors with personalized notes', count: riskDonors.length },
    { text: 'Create a re-engagement email campaign for lapsed donors', count: Math.max(0, Math.floor(totalDonors * 0.15)) },
    { text: 'Schedule stewardship touches for top 10% donors by giving', count: Math.max(0, Math.floor(totalDonors * 0.1)) }
  ]

  return res.json({
    summary: { totalDonors, totalDonations, totalAmount },
    riskDonors,
    suggestions
  })
}
