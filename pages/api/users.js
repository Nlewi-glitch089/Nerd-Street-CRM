import { getPrisma } from '../../lib/prisma'

const prisma = getPrisma()

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, active: true, deactivatedAt: true, deactivatedBy: true, createdAt: true } , orderBy: { createdAt: 'desc' }})
      return res.status(200).json({ users })
    } catch (err) {
      console.error('Users API error', err)
      return res.status(500).json({ error: 'Failed to list users' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
