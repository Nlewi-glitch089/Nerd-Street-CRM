import { getUserFromToken } from '../../../lib/auth'
import { PrismaClient } from '@prisma/client'

let prisma
if (!global.__prisma) global.__prisma = new PrismaClient()
prisma = global.__prisma

// Admin-only: rename campaigns according to a mapping.
// Body options:
// - renames: [{ oldName, newName }, ...]
// - byId: [{ id, newName }, ...]
// Behavior:
// - For oldName renames: finds campaigns with that oldName, merges duplicates into a keeper,
//   then attempts to set keeper.name = newName. If a campaign with newName already exists,
//   donations are moved into that existing campaign and the old campaigns deleted (no duplicate names left).
// - For byId renames: if newName exists on a different campaign, donations are moved into that campaign and the renamed campaign deleted;
//   otherwise, the campaign is updated to the newName.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = req.headers.authorization || ''
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing authorization token' })

  const actor = await getUserFromToken(token)
  if (!actor) return res.status(401).json({ error: 'Invalid or expired token' })
  if (actor.role !== 'ADMIN') return res.status(403).json({ error: 'Admin role required' })

  const { password, renames, byId } = req.body || {}
  if (!password) return res.status(400).json({ error: 'Password required' })
  if (password !== actor.password) return res.status(403).json({ error: 'Password incorrect' })

  const results = []

  try {
    // Handle renames by oldName
    if (Array.isArray(renames)) {
      for (const r of renames) {
        const oldName = String(r.oldName || '').trim()
        const newName = String(r.newName || '').trim()
        if (!oldName || !newName) { results.push({ oldName, newName, error: 'Invalid names' }); continue }

        const group = await prisma.campaign.findMany({ where: { name: oldName }, include: { donations: true } })
        if (!group || group.length === 0) { results.push({ oldName, newName, note: 'No campaigns found with that oldName' }); continue }

        // If a campaign with newName already exists, we'll merge into that and delete the old ones
        let target = await prisma.campaign.findFirst({ where: { name: newName } })
        if (target) {
          // move donations from all campaigns in group to target
          let moved = 0
          for (const c of group) {
            if (c.id === target.id) continue
            const upd = await prisma.donation.updateMany({ where: { campaignId: c.id }, data: { campaignId: target.id } })
            moved += upd.count || 0
            await prisma.campaign.delete({ where: { id: c.id } })
          }
          results.push({ oldName, newName, action: 'mergedIntoExisting', keptId: target.id, movedDonations: moved })
          continue
        }

        // Otherwise, pick a keeper and move donations from duplicates into keeper
        group.sort((a,b) => (a.id < b.id ? -1 : 1))
        const keeper = group[0]
        let moved = 0
        for (const dup of group.slice(1)) {
          const upd = await prisma.donation.updateMany({ where: { campaignId: dup.id }, data: { campaignId: keeper.id } })
          moved += upd.count || 0
          await prisma.campaign.delete({ where: { id: dup.id } })
        }
        // now update keeper name to newName
        const updated = await prisma.campaign.update({ where: { id: keeper.id }, data: { name: newName } })
        results.push({ oldName, newName, action: 'renamed', keptId: keeper.id, movedDonations: moved, updated })
      }
    }

    // Handle renames by id
    if (Array.isArray(byId)) {
      for (const r of byId) {
        const id = String(r.id || '')
        const newName = String(r.newName || '').trim()
        if (!id || !newName) { results.push({ id, newName, error: 'Invalid id or newName' }); continue }

        const current = await prisma.campaign.findUnique({ where: { id }, include: { donations: true } })
        if (!current) { results.push({ id, newName, error: 'Campaign not found' }); continue }

        const existing = await prisma.campaign.findFirst({ where: { name: newName } })
        if (existing && existing.id !== current.id) {
          // move donations into existing and delete current
          const upd = await prisma.donation.updateMany({ where: { campaignId: current.id }, data: { campaignId: existing.id } })
          await prisma.campaign.delete({ where: { id: current.id } })
          results.push({ id, newName, action: 'mergedIntoExisting', keptId: existing.id, movedDonations: upd.count || 0 })
          continue
        }

        // otherwise update current name
        const updated = await prisma.campaign.update({ where: { id }, data: { name: newName } })
        results.push({ id, newName, action: 'renamed', updated })
      }
    }

    return res.status(200).json({ ok: true, results })
  } catch (err) {
    console.error('Rename campaigns error', err)
    return res.status(500).json({ error: 'Rename failed', details: String(err) })
  }
}
