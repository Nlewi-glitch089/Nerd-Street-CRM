import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function CampaignDetail() {
  const router = useRouter()
  const { id } = router.query || {}
  const [loading, setLoading] = useState(true)
  const [campaign, setCampaign] = useState(null)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!id) return
      try {
        setLoading(true)

        // require auth first
        const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
        if (!token) {
          setError('Not authenticated')
          setLoading(false)
          return
        }
        const p = await fetch('/api/protected', { headers: { Authorization: `Bearer ${token}` } })
        if (!p.ok) {
          setError('Session invalid')
          setLoading(false)
          return
        }
        const pd = await p.json()
        if (!pd?.user) {
          setError('Unable to load user')
          setLoading(false)
          return
        }
        if (mounted) setUser(pd.user)

        // load campaigns and find the requested one
        const res = await fetch('/api/campaigns')
        if (!res.ok) throw new Error('Failed to load campaigns')
        const data = await res.json()
        const list = Array.isArray(data.campaigns) ? data.campaigns : []
        const found = list.find(c => String(c.id) === String(id))
        if (!found) {
          if (mounted) setError('Campaign not found')
          return
        }
        if (mounted) setCampaign(found)

        // allow if admin
        if (pd.user.role === 'ADMIN') {
          if (mounted) setAllowed(true)
          return
        }

        // non-admin: try to determine assignment via partners/follow-ups seed
        try {
          const sdRes = await fetch('/api/seed', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{} ) } })
          if (sdRes.ok) {
            const sd = await sdRes.json()
            const qname = (found.name || '').toLowerCase().trim()
            const byPartner = (sd.partners || []).some(p => {
              const pname = (p.name || p.title || '').toLowerCase()
              if (!pname) return false
              const owners = p.owners || []
              return pname.includes(qname.split(' ')[0]) && owners.includes(pd.user.email)
            })
              const byFollowUp = (sd.followUps || []).some(f => {
              const fname = (f.campaign?.name || f.name || '').toLowerCase()
              if (!fname) return false
              // support entries may include names - allow if user's name appears in support
              const supportMatch = (f.support || []).some(s => (s.email && s.email === pd.user.email) || (s.name && pd.user.name && s.name.toLowerCase().includes((pd.user.name||'').toLowerCase().split(' ')[0])))
              return fname.includes(qname.split(' ')[0]) && (supportMatch || (f.assignedRole && String(f.assignedRole).toLowerCase().includes((pd.user.role||'').toLowerCase())))
            })
            if (byPartner || byFollowUp) {
              if (mounted) setAllowed(true)
              return
            }
          }
        } catch (e) {
          console.warn('Assignment lookup failed', e)
        }

        // default: not allowed
        if (mounted) setAllowed(false)
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id])

  if (loading) return <div style={{padding:20}}>Loading campaign…</div>
  if (error) return <div style={{padding:20, color:'#ff8080'}}>{error}</div>
  if (!campaign) return <div style={{padding:20}}>No campaign</div>
  if (!allowed) return (
    <div style={{padding:20}}>
      <h3 style={{color:'var(--color-neon)'}}>Access restricted</h3>
      <div style={{color:'#bbb', marginTop:8}}>You do not have permission to view this campaign. If you believe this is an error, contact an administrator or request temporary access.</div>
      <div style={{marginTop:14}}>
        <button className="btn" onClick={() => router.push('/team')}>Back to team</button>
      </div>
    </div>
  )

  return (
    <div style={{padding:20}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2 style={{color:'var(--color-neon)'}}>{campaign.name}</h2>
        <div>
          <button className="btn" onClick={() => router.back()}>Back</button>
        </div>
      </div>

      <div style={{marginTop:12, padding:12, border:'1px solid rgba(255,255,255,0.03)', borderRadius:8}}>
        <div><strong>Goal:</strong> {campaign.goal ? `$${campaign.goal}` : '-'}</div>
        <div style={{marginTop:6}}><strong>Raised:</strong> ${campaign.raised || 0}</div>
        <div style={{marginTop:6}}><strong>Approved:</strong> {campaign.approved ? 'Yes' : 'No'}</div>
        {(campaign.startAt || campaign.endAt) && (
          <div style={{marginTop:6}}><strong>Timeframe:</strong> {campaign.startAt ? new Date(campaign.startAt).toLocaleString() : '-'} → {campaign.endAt ? new Date(campaign.endAt).toLocaleString() : '-'}</div>
        )}

        <div style={{marginTop:12}}>
          <em style={{color:'#bbb'}}>Read-only view for collaborators - contact an admin to make changes.</em>
        </div>
      </div>
    </div>
  )
}
