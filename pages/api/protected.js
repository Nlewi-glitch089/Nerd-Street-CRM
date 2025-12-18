import { getUserFromToken } from '../../lib/auth'

export default async function handler(req, res) {
  const auth = req.headers?.authorization || req.headers?.Authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing authorization token' })

  const user = await getUserFromToken(token)
  if (!user) return res.status(401).json({ error: 'Invalid or expired token' })

  return res.status(200).json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } })
}
