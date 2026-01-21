import { getUserFromToken } from '../../../../lib/auth'
import getPrisma from '../../../../lib/prisma'

export default async function handler(req, res) {
  const prisma = getPrisma()
  try {
    const auth = req.headers?.authorization
    const token = auth && auth.startsWith('Bearer ') ? auth.split(' ')[1] : null
    const user = token ? await getUserFromToken(token) : null
    if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'Unauthorized' })

    const rows = await prisma.tempAccessRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })
    return res.status(200).json({ ok: true, requests: rows })
  } catch (err) {
    console.error('admin request-access list error', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
