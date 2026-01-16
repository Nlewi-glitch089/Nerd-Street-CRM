import { getUserFromToken } from '../../../lib/auth'
import { callExternalAI } from '../../../lib/ai'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth
    const user = await getUserFromToken(token)
    if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' })

    const { question, context } = req.body || {}
    if (!question || typeof question !== 'string') return res.status(400).json({ error: 'Question is required' })

    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API || null
    if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured on the server' })

    // Build a compact prompt that includes the previous AI result (if provided) for context
    const ctx = context ? JSON.stringify(context).slice(0, 20000) : ''
    const prompt = `You are an internal analytics assistant. Use the provided context (if any) and answer the question succinctly and with actionable guidance. Context:\n${ctx}\n\nQuestion:\n${question}\n\nRespond in plain text.`

    const reply = await callExternalAI(prompt, apiKey)
    return res.status(200).json({ ok: true, answer: reply })
  } catch (err) {
    console.error('ai-question error', err)
    return res.status(500).json({ error: String(err) })
  }
}
