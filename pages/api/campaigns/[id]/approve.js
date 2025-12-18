import { getUserFromToken } from '../../../../lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = global.__prisma || new PrismaClient()
if (!global.__prisma) global.__prisma = prisma

export default async function handler(req, res) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Missing campaign id' })

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const auth = req.headers.authorization
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
    const actor = token ? await getUserFromToken(token) : null
    if (!actor) return res.status(401).json({ error: 'Unauthorized' })
    if (actor.role !== 'ADMIN') return res.status(403).json({ error: 'Admin role required' })

    const { action, approved, password } = req.body || {}
    // require explicit password confirmation (same behavior as /api/clear)
    if (!password) return res.status(400).json({ error: 'Password required to confirm action' })
    // accept both { action: 'approve' } or { approved: true }
    let setApproved = null
    if (typeof approved === 'boolean') setApproved = approved
    else if (action === 'approve') setApproved = true
    else if (action === 'deactivate') setApproved = false

    if (setApproved === null) return res.status(400).json({ error: 'Missing action or approved flag' })

    // verify password matches actor.password (example project stores plaintext)
    if (password !== actor.password) return res.status(403).json({ error: 'Password incorrect' })

    const updated = await prisma.campaign.update({ where: { id: String(id) }, data: { approved: setApproved } })

    return res.status(200).json({ campaign: updated })
  } catch (err) {
    console.error('Approve campaign error', err)
    return res.status(500).json({ error: 'Server error', details: String(err) })
  }
}
