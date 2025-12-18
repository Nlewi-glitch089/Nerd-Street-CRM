export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const body = req.body || {}
    // basic validation
    const { email, scope, note } = body
    if (!email || !scope) return res.status(400).json({ error: 'Missing required fields' })

    // For now: log the request server-side and return success.
    // This endpoint DOES NOT grant permissions — it's a request ticket.
    console.log('TEMP ACCESS REQUEST:', { email, scope, note, at: new Date().toISOString() })

    // Respond with a simple acknowledgement. In a real system you'd enqueue this
    // for admin review, store it in the DB, and notify relevant approvers.
    return res.status(200).json({ ok: true, message: 'Request received. Admin will review.' })
  } catch (err) {
    console.error('request-access error', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
