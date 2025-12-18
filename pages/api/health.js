import { query } from '../../lib/db';

export default async function handler(req, res) {
  try {
    const result = await query('SELECT NOW() as now');
    res.status(200).json({ ok: true, now: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
