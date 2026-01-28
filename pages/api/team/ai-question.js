import { getUserFromToken } from '../../../lib/auth'
import { callExternalAI } from '../../../lib/ai'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth
    const user = await getUserFromToken(token)
    if (!user || (user.role !== 'TEAM_MEMBER' && user.role !== 'ADMIN')) return res.status(403).json({ error: 'Forbidden' })

    const { question, context } = req.body || {}
    if (!question || typeof question !== 'string') return res.status(400).json({ error: 'Question is required' })

    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API || null
    if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured on the server' })

    // Build compact context from dashboard state (truncate to reasonable size)
    const ctx = context ? JSON.stringify(context).slice(0, 20000) : ''
    const prompt = `You are a helpful internal assistant for the team dashboard. Use the provided context and answer the question clearly and with actionable next steps for the team member. Context:\n${ctx}\n\nQuestion:\n${question}\n\nRespond in plain text.`

    let reply
    try {
      reply = await callExternalAI(prompt, apiKey)
      return res.status(200).json({ ok: true, answer: reply })
    } catch (err) {
      // try to parse structured error returned from callExternalAI (it throws text)
      const msg = String(err?.message || err || '')
      let parsed = null
      try {
        const idx = msg.indexOf('{')
        if (idx >= 0) {
          const maybe = msg.slice(idx)
          parsed = JSON.parse(maybe)
        }
      } catch (e) { parsed = null }

      const code = (parsed && parsed.error && parsed.error.code) || (msg.includes('insufficient_quota') ? 'insufficient_quota' : (msg.includes('invalid_api_key') || msg.includes('Incorrect API key') ? 'invalid_api_key' : 'ai_error'))
      if (code === 'insufficient_quota') {
        return res.status(502).json({ ok: false, code: 'insufficient_quota', message: 'AI temporarily unavailable - quota exhausted' })
      }
      if (code === 'invalid_api_key') {
        return res.status(502).json({ ok: false, code: 'invalid_api_key', message: 'AI misconfigured - invalid API key' })
      }
      console.error('team ai-question error', err)
      return res.status(500).json({ ok: false, code: 'ai_error', message: 'AI request failed' })
    }
  } catch (err) {
    console.error('team ai-question error', err)
    return res.status(500).json({ error: String(err) })
  }
}
