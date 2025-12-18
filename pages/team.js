import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function Team() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)

  const [tasks, setTasks] = useState([])
  const [followUps, setFollowUps] = useState([])
  const [partners, setPartners] = useState([])
  const [selectedPartner, setSelectedPartner] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [signOutMessage, setSignOutMessage] = useState(null)

  function formatOwnersForDisplay(p) {
    const owners = p.owners || []
    if (!owners.length) return ''
    // try to map emails to contact names/titles when possible
    const mapped = owners.map(email => {
      const match = (p.contacts || []).find(c => c.email === email)
      if (match) return `${match.name}${match.title ? ` — ${match.title}` : ''}`
      // fallback: show local team hint
      return email.includes('@') ? `${email}` : email
    })
    return (mapped.length === 1) ? `Assigned: ${mapped[0]}` : `Team: ${mapped.join(', ')}`
  }

  function isDateOverdue(due) {
    if (!due) return false
    const parsed = new Date(due)
    if (isNaN(parsed)) return false
    const now = new Date()
    // compare only date (not time)
    return parsed < new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }

  function overdueDays(due) {
    const parsed = new Date(due)
    if (isNaN(parsed)) return 0
    const now = new Date()
    const diff = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - parsed) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
        if (!token) {
          if (mounted) setError('Not authenticated')
          return
        }
        const res = await fetch('/api/protected', { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) {
          if (mounted) setError('Session invalid or expired')
          try { localStorage.removeItem('token') } catch (e) {}
          return
        }
        const data = await res.json()
        if (!data?.user) {
          if (mounted) setError('Unable to load user')
          return
        }
        // allow TEAM_MEMBER or ADMIN
        if (data.user.role !== 'TEAM_MEMBER' && data.user.role !== 'ADMIN') {
          if (mounted) setError('Unauthorized — team member access required')
          return
        }
        if (mounted) setUser(data.user)
        if (mounted) {
          // try server seed (if available) otherwise use local seed
          try {
            const seedRes = await fetch('/api/seed', { method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` } })
              if (seedRes.ok) {
                const sd = await seedRes.json()
                setTasks(sd.tasks || [])
                setFollowUps(sd.followUps || [])
                // Normalize partners so UI can rely on `name`, `tag`, and `health`
                const normPartners = (sd.partners || []).map(p => ({
                  name: p.name || p.title || '',
                  tag: p.tag || '',
                  health: p.health || '',
                  owners: p.owners || [],
                  description: p.description || '',
                  contractValue: p.contractValue || '',
                  startDate: p.startDate || '',
                  endDate: p.endDate || '',
                  lastContact: p.lastContact || '',
                  contacts: p.contacts || [],
                  interactions: p.interactions || [],
                  programs: p.programs || [],
                  reminders: p.reminders || []
                }))
                // show only partners assigned to this user when possible
                const visible = normPartners.filter(p => (p.owners && p.owners.length > 0) ? p.owners.includes(data.user.email) : true)
                setPartners(visible.length ? visible : normPartners)
                // Normalize recentActivity items so team UI fields exist regardless of source shape
                const normRecent = (sd.recentActivity || []).map((it, i) => ({
                  id: it.id || `r${i+1}`,
                  partner: it.partner || it.title || it.name || '',
                  text: it.text || it.note || '',
                  date: it.date || it.at || ''
                }))
                setRecentActivity(normRecent)
              } else {
                localSeed()
              }
          } catch (e) {
            localSeed()
          }
        }
      } catch (err) {
        if (mounted) setError('Network error')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  function localSeed() {
    // local fallback that mirrors the admin-seed content (non-personal)
    setTasks([
      { id: 't1', title: 'Follow up with Alienware', due: '2025-12-14', note: 'Send co-marketing proposal and content calendar' },
      { id: 't2', title: 'Reach out to Red Bull Gaming', due: '2025-12-19', note: 'Discuss 2025 renewal terms' }
    ])
    setFollowUps([
      { id: 'f1', name: 'Back-to-School Supply Drive', days: 30 },
      { id: 'f2', name: 'Summer Youth Programs Fund', days: 60 },
      { id: 'f3', name: 'Neighborhood Health Initiative', days: 90 }
    ])
    setPartners([
      { name: 'GameStop', tag: 'At Risk', health: '45%' },
      { name: 'Discord', tag: 'Pending', health: '70%' },
      { name: 'Alienware', tag: 'Active', health: '85%' },
      { name: 'Red Bull Gaming', tag: 'Active', health: '92%' }
    ])
    setRecentActivity([
      { id: 'r1', partner: 'Alienware', text: 'Equipment delivery confirmed for new venue opening.', date: 'Dec 7, 2025' },
      { id: 'r2', partner: 'Red Bull Gaming', text: 'Discussed Q1 2025 tournament schedule and activation opportunities.', date: 'Dec 4, 2025' }
    ])
  }

  if (loading) return (
    <div style={{position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#000', zIndex:9999}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:84, height:84, borderRadius:999, border:'8px solid rgba(57,255,20,0.06)', borderTopColor:'#39ff14', boxShadow:'0 0 30px rgba(57,255,20,0.08)', margin:'0 auto', animation:'spin 1s linear infinite'}} />
        <div style={{color:'#39ff14', marginTop:14, fontSize:16}}>Loading dashboard...</div>
      </div>
      <style jsx>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (error) return <div style={{padding:20, color:'red'}}>{error}</div>

  return (
    <div style={{padding:18}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
        <div>
          <div style={{color:'var(--color-neon)', fontWeight:800, fontSize:18}}>MY WORKSPACE</div>
          <div style={{color:'#bbb'}}>Welcome back{user?.name ? `, ${user.name}` : ''}{user?.role ? ` — ${user.role.replace('_',' ')}` : ''}</div>
        </div>
        <div style={{display:'flex', gap:12}}>
          <button className="btn" onClick={() => { try { router.push('/profile') } catch(e){ console.warn('Profile nav failed', e) } }}>Profile</button>
          <button className="btn btn-ghost" onClick={() => {
            try { localStorage.removeItem('token') } catch(e){ console.warn('removeItem token failed', e) }
            try {
              console.log('Team sign-out: clearing client state')
              // clear local state
              setUser(null)
              setTasks([])
              setFollowUps([])
              setPartners([])
              setRecentActivity([])
            } catch (e) { console.warn('Error clearing client state', e) }
            setSignOutMessage('Signed out')
            setTimeout(() => {
              setSignOutMessage(null)
              try {
                router.replace('/')
              } catch (e) {
                console.warn('router.replace failed during sign-out, falling back to location.href', e)
                try { window.location.href = '/' } catch (err) { console.warn('Fallback redirect failed', err) }
              }
            }, 800)
          }}>Logout</button>
        </div>
      </div>
      {signOutMessage && (
        <div style={{position:'fixed', right:20, top:20, background:'rgba(0,0,0,0.8)', color:'var(--color-neon)', padding:'10px 14px', borderRadius:8, border:'1px solid rgba(57,255,20,0.08)'}}>
          {signOutMessage}
        </div>
      )}

      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:14}}>
        <div style={{padding:18, border:'1px solid rgba(47,255,85,0.16)', borderRadius:8}}>
          <div style={{fontWeight:700, color:'var(--color-neon)'}}>My Tasks</div>
          <div style={{fontSize:28, marginTop:8}}>{tasks.length}</div>
          <div style={{fontSize:12, color:'#bbb'}}>Action items due soon</div>
        </div>
        <div style={{padding:18, border:'1px solid rgba(255,193,7,0.12)', borderRadius:8}}>
          <div style={{fontWeight:700, color:'#ffcc00'}}>Follow-ups Needed</div>
          <div style={{fontSize:28, marginTop:8}}>{followUps.length}</div>
          <div style={{fontSize:12, color:'#bbb'}}>Partners need contact</div>
        </div>
        <div style={{padding:18, border:'1px solid rgba(66,138,255,0.12)', borderRadius:8}}>
          <div style={{fontWeight:700, color:'#6fb3ff'}}>My Partners</div>
          <div style={{fontSize:28, marginTop:8}}>{partners.length}</div>
          <div style={{fontSize:12, color:'#bbb'}}>Active accounts</div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:12}}>
        {selectedPartner && (
          <div style={{gridColumn:'1 / span 2', padding:18, border:'1px solid rgba(57,255,20,0.12)', borderRadius:8, marginBottom:8}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <div style={{fontWeight:900, fontSize:18}}>{selectedPartner.name}</div>
                <div style={{fontSize:13, color:'#bbb', marginTop:6}}>{selectedPartner.description}</div>
                {selectedPartner.owners && selectedPartner.owners.length > 0 && (
                  <div style={{fontSize:12, color:'#9ea', marginTop:8}}>{formatOwnersForDisplay(selectedPartner)}</div>
                )}
              </div>
              <div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:12, color:'#bbb'}}>Partnership Health</div>
                  <div style={{fontSize:22, color:'#39ff14', fontWeight:700}}>{selectedPartner.health || '—'}</div>
                </div>
                <button className="btn btn-ghost" onClick={() => setSelectedPartner(null)} style={{marginTop:8}}>Close</button>
              </div>
            </div>
            <div style={{display:'flex', gap:20, marginTop:12}}>
              <div style={{flex:1}}>
                <div style={{display:'flex', gap:12}}>
                  <div style={{flex:1}}><strong>Contract Value</strong><div style={{marginTop:6}}>{selectedPartner.contractValue || '—'}</div></div>
                  <div style={{flex:1}}><strong>Start Date</strong><div style={{marginTop:6}}>{selectedPartner.startDate || '—'}</div></div>
                  <div style={{flex:1}}><strong>End Date</strong><div style={{marginTop:6}}>{selectedPartner.endDate || '—'}</div></div>
                  <div style={{flex:1}}><strong>Last Contact</strong><div style={{marginTop:6}}>{selectedPartner.lastContact || '—'}</div></div>
                </div>
                {(selectedPartner.interactions || []).length > 0 && (
                  <div style={{marginTop:12}}>
                    <div style={{fontWeight:700, color:'#39ff14'}}>Recent Interactions</div>
                    {(selectedPartner.interactions || []).slice().sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0,2).map(it => (
                      <div key={it.id || it.date} style={{marginTop:8}}>
                        <div style={{fontWeight:700}}>{it.type || it.kind || it.title} <span style={{fontSize:12,color:'#bbb',marginLeft:8}}>{it.date}</span></div>
                        <div style={{color:'#bbb',marginTop:4}}>{it.note || it.text}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <div style={{padding:18, border:'1px solid rgba(255,255,255,0.03)', borderRadius:8}}>
          <div style={{fontWeight:700, color:'var(--color-neon)', marginBottom:8}}>Priority Actions</div>
                {tasks.length === 0 ? (
            <div style={{color:'#888'}}>No tasks</div>
          ) : (
            tasks.map(t => {
              const overdue = isDateOverdue(t.due)
              return (
              <div key={t.id} style={{padding:12, border: overdue ? '1px solid rgba(255,77,79,0.18)' : '1px solid rgba(255,255,255,0.03)', borderRadius:6, marginBottom:8, background: overdue ? 'rgba(255,77,79,0.03)' : 'transparent'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div style={{fontWeight:700}}>{t.title}</div>
                  {overdue && (<div style={{fontSize:12,color:'#ff4d4f',fontWeight:700}}>Overdue · {overdueDays(t.due)}d</div>)}
                </div>
                <div style={{fontSize:13, color:'#bbb', marginTop:6}}>{t.note}</div>
                <div style={{fontSize:12, color: overdue ? '#ffb3b3' : '#ffd57a', marginTop:6}}>Due: {t.due}</div>
              </div>
            )})
          )}
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          <div style={{padding:14, border:'1px solid rgba(255,255,255,0.03)', borderRadius:8}}>
            <div style={{fontWeight:700, color:'var(--color-neon)'}}>Recent Activity</div>
            {recentActivity.map(r => (
              <div key={r.id} style={{marginTop:10}}>
                <div style={{fontWeight:700}}>{r.partner} <span style={{fontSize:12, color:'#bbb', marginLeft:8}}>{r.date}</span></div>
                <div style={{fontSize:13, color:'#bbb'}}>{r.text}</div>
              </div>
            ))}
          </div>

          <div style={{padding:14, border:'1px solid rgba(255,255,255,0.03)', borderRadius:8}}>
            <div style={{fontWeight:700, color:'var(--color-neon)'}}>Partners</div>
              {partners.length === 0 ? (
                <div style={{color:'#888', marginTop:8}}>No partners assigned</div>
              ) : (
                <div style={{display:'grid', gridTemplateColumns:'1fr', gap:8, marginTop:8}}>
                  {partners.map((p, i) => {
                    const slug = (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                    return (
                    <div key={p.name + i} style={{padding:10, border:'1px solid rgba(255,255,255,0.02)', borderRadius:6, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div onClick={() => setSelectedPartner(p)} style={{cursor:'pointer'}}>
                        <div style={{fontWeight:700}}>{p.name}</div>
                        <div style={{fontSize:12, color:'#bbb'}}>{p.tag}{p.health ? ` · ${p.health}` : ''}</div>
                        <div style={{fontSize:11, color:'#9ea', marginTop:6}}>
                          {formatOwnersForDisplay(p)}
                        </div>
                        <div style={{fontSize:11, color:'#bbb', marginTop:4}}>
                          {p.lastContact ? `Last: ${p.lastContact}` : ''} {p.reminders ? `· Reminders: ${p.reminders.length}` : ''}
                        </div>
                      </div>
                      <div>
                        <button className="btn btn-link" onClick={() => { try { router.push(`/partners/${slug}`) } catch(e){ console.warn('nav to partner page failed', e) } }}>View</button>
                      </div>
                    </div>
                  )})}
                </div>
              )}
          </div>

          <div style={{padding:14, border:'1px solid rgba(255,255,255,0.03)', borderRadius:8}}>
            <div style={{fontWeight:700, color:'var(--color-neon)'}}>Needs Follow-up</div>
              <div style={{fontSize:12,color:'#bbb', marginTop:6}}>This section surfaces campaigns and partners that require follow-up. Click any item to inspect details.</div>
              <div style={{display:'flex', flexDirection:'column', gap:8, marginTop:8}}>
                {followUps.length === 0 && (<div style={{color:'#888'}}>No follow-ups scheduled</div>)}
                {followUps.map(f => (
                  <div key={f.id} style={{padding:10, border:'1px solid rgba(57,255,20,0.04)', borderRadius:6, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                      <div style={{fontWeight:700}}>{f.campaign?.name || f.name}</div>
                      <div style={{fontSize:12, color:'#bbb'}}>{f.note || `${f.days}+ days since contact`}</div>
                      {f.assignedRole && <div style={{fontSize:12, color:'#9ea', marginTop:6}}>Assigned Role: {f.assignedRole}</div>}
                      {f.support && f.support.length > 0 && (
                        <div style={{fontSize:12, color:'#9ea', marginTop:4}}>Support: {f.support.map(s => s.name + (s.role ? ` — ${s.role}` : '')).join(', ')}</div>
                      )}
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
                      <div style={{width:10, height:10, borderRadius:10, background:(f.days && f.days > 60) ? '#ff4d4f' : '#ffcc00'}} />
                      <button className="btn btn-link" onClick={() => {
                        // try to find a related partner by name
                        const related = partners.find(p => (p.name || '').toLowerCase().includes((f.campaign?.name || f.name || '').toLowerCase().split(' ')[0]))
                        if (related) {
                          setSelectedPartner(related)
                        } else {
                          alert('Open campaign details in Admin view to manage this follow-up')
                        }
                      }}>View</button>
                    </div>
                  </div>
                ))}
              </div>
          </div>
        </div>
      </div>
    </div>
  )
}
