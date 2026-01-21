import { getUserFromToken } from '../../../../../lib/auth'
import getPrisma from '../../../../../lib/prisma'

export default async function handler(req, res) {
  const prisma = getPrisma()
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const auth = req.headers?.authorization
    const token = auth && auth.startsWith('Bearer ') ? auth.split(' ')[1] : null
    const user = token ? await getUserFromToken(token) : null
    if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'Unauthorized' })

    const { id } = req.query || {}
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const body = req.body || {}
    const { decision, note, expiresHours } = body
    if (!decision) return res.status(400).json({ error: 'Missing decision' })
    const d = String(decision).toLowerCase()
    const status = d.startsWith('approve') || d === 'approved' ? 'APPROVED' : 'DENIED'

    const data = { status, reviewedBy: user.id, reviewedAt: new Date() }
    if (status === 'APPROVED') {
      const hrs = parseInt(expiresHours || process.env.REQUEST_EXPIRES_HOURS || '72', 10)
      data.expiresAt = new Date(Date.now() + hrs * 3600 * 1000)
    }

    const updated = await prisma.tempAccessRequest.update({ where: { id: String(id) }, data })

    // TODO: Optionally create grant records or adjust user permissions here.

    // If approved, grant the requester an ADMIN role so they immediately gain access.
    // This is a pragmatic, minimal implementation — consider adding a proper
    // temporary-grants model later and reverting roles on expiry.
    if (status === 'APPROVED' && updated.requesterId) {
      try {
        await prisma.user.update({ where: { id: updated.requesterId }, data: { role: 'ADMIN' } })
      } catch (err) {
        console.error('failed to grant admin role to requester', err)
      }
    }

    return res.status(200).json({ ok: true, request: updated })
  } catch (err) {
    console.error('request-access decision error', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
