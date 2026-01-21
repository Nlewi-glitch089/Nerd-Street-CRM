import getPrisma from '../../../lib/prisma'

const DEFAULT_REVIEW_HOURS = parseInt(process.env.REQUEST_REVIEW_HOURS || '24', 10)

export default async function handler(req, res) {
  const prisma = getPrisma()
  try {
    if (req.method === 'POST') {
      const body = req.body || {}
      const { email, scope, note, requesterId } = body
      if (!email || !scope) return res.status(400).json({ error: 'Missing required fields' })

      // persist request
      const created = await prisma.tempAccessRequest.create({ data: { requesterId: requesterId || null, requesterEmail: String(email), scope: String(scope), note: note || null } })

      // simple acknowledgement with ETA
      const eta = `${DEFAULT_REVIEW_HOURS} hours`
      return res.status(200).json({ ok: true, message: `Request received. Admins typically review requests within ${eta}.`, request: { id: created.id, status: created.status, createdAt: created.createdAt } })
    }

    if (req.method === 'GET') {
      // Return requests for an email (query ?email=)
      const { email } = req.query || {}
      if (!email) return res.status(400).json({ error: 'Missing email query param' })
      const rows = await prisma.tempAccessRequest.findMany({ where: { requesterEmail: String(email) }, orderBy: { createdAt: 'desc' }, take: 10 })
      return res.status(200).json({ ok: true, requests: rows })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('request-access error', err)
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({ error: 'Server error', details: String(err && err.message), stack: err && err.stack })
    }
    return res.status(500).json({ error: 'Server error' })
  }
}
