import { useEffect, useState, useRef } from 'react'
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
  const [logsLoading, setLogsLoading] = useState(false)
  const [signOutMessage, setSignOutMessage] = useState(null)
  // AI chat follow-ups for team dashboard
  const [aiChatMessages, setAiChatMessages] = useState([])
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiQuestionLoading, setAiQuestionLoading] = useState(false)
  const [aiGeneratingId, setAiGeneratingId] = useState(null)
  // floating assistant panel state (draggable, minimizable)
  const [aiPanelVisible, setAiPanelVisible] = useState(false)
  const [aiMinimized, setAiMinimized] = useState(false)
  const [aiPos, setAiPos] = useState({ left: null, top: null })
  const aiDragRef = useRef({ dragging: false, startX: 0, startY: 0, origLeft: 0, origTop: 0 })

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

  async function generateOutreachArtifacts(item, kind = 'task') {
  function parseOutreach(answer) {
    if (!answer) return null
    // Try strict JSON first
    try {
      const parsed = JSON.parse(answer)
      const keys = Object.keys(parsed || {})
      if (keys.length && (parsed.email || parsed.agenda || parsed.summary || parsed.STATUS_SUMMARY)) {
        return {
          email: parsed.email || parsed.EMAIL || parsed.Email || parsed.emailBody || null,
          agenda: parsed.agenda || parsed.AGENDA || null,
          summary: parsed.summary || parsed.SUMMARY || parsed['STATUS_SUMMARY'] || null
        }
      }
    } catch (e) {
      // not JSON — fall through to heading-based parsing
    }

    const sections = { email: null, agenda: null, summary: null }
    const regex = /(?:^|\n)\s*(?:#{1,3}\s*)?(EMAIL|AGENDA|STATUS SUMMARY|SUMMARY)\s*(?:[:#-]*)\s*\n([\s\S]*?)(?=(?:\n\s*(?:#{1,3}\s*)?(?:EMAIL|AGENDA|STATUS SUMMARY|SUMMARY)\b)|$)/ig
    let m
    while ((m = regex.exec(answer)) !== null) {
      const key = (m[1] || '').toLowerCase()
      const body = (m[2] || '').trim()
      if (key.includes('email')) sections.email = body
      else if (key.includes('agenda')) sections.agenda = body
      else if (key.includes('status') || key.includes('summary')) sections.summary = body
    }
    // If no headings matched, try simple labeled splits like "EMAIL:" etc.
    if (!sections.email && !sections.agenda && !sections.summary) {
      const simpleRegex = /(EMAIL|AGENDA|STATUS SUMMARY|SUMMARY)\s*[:\-]*\s*([\s\S]*)/i
      const sim = answer.match(simpleRegex)
      if (sim) {
        // fallback: place whole answer in summary
        sections.summary = answer.trim()
      }
    }
    return sections
  }

  async function handleOutreachFromChat(q) {
    // try to find a referenced item in current context
    const qLower = (q || '').toLowerCase()
    let found = null
    let kind = 'task'
    if (tasks && tasks.length) {
      found = tasks.find(t => (t.title || '').toLowerCase().includes(qLower) || qLower.includes((t.title || '').toLowerCase().split(' ')[0]))
      if (found) kind = 'task'
    }
    if (!found && followUps && followUps.length) {
      found = followUps.find(f => (f.name || '').toLowerCase().includes(qLower) || qLower.includes((f.name || '').toLowerCase().split(' ')[0]))
      if (found) kind = 'followup'
    }
    if (!found && partners && partners.length) {
      found = partners.find(p => (p.name || '').toLowerCase().includes(qLower) || qLower.includes((p.name || '').toLowerCase().split(' ')[0]))
      if (found) kind = 'partner'
    }

    if (found) {
      await generateOutreachArtifacts(found, kind)
      return
    }

    // no explicit item found — generate freeform outreach using the user's query as the subject
    await generateOutreachArtifacts({ id: `free-${Date.now()}`, name: q, note: q }, 'task')
  }

    try {
      setAiGeneratingId(item.id || (item.name || '').slice(0,8))
      const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
      const today = new Date().toISOString().slice(0,10)
      const short = kind === 'task' ? (item.title || item.name || '') : (item.name || '')
      const prompt = `Date: ${today}\n\nYou are an assistant helping a nonprofit team re-engage an overdue partner/task. Create three artifacts for the following overdue item:\n\nItem: ${short}\nDetails: ${JSON.stringify(item).slice(0,1000)}\n\nReturn the output with clear headings (### EMAIL ###, ### AGENDA ###, ### STATUS SUMMARY ###).\n1) EMAIL: Provide a concise subject line and a friendly, professional email body to the client requesting a short check-in to resolve outstanding issues.\n2) AGENDA: Provide a 20-minute meeting agenda with timings and objectives.\n3) STATUS SUMMARY: Provide a one-page status summary (3-6 bullet points) with current status, outstanding issues, owners, and next steps. Be concise and action-oriented.`

      const res = await fetch('/api/team/ai-question', { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{} ) }, body: JSON.stringify({ question: prompt, context: { item, user } }) })
      const data = await res.json().catch(()=>null)
      if (!res.ok) {
        const msg = data?.message || data?.error || 'AI request failed'
        setAiChatMessages(m => [...m, { role: 'assistant', text: `Could not generate outreach artifacts: ${msg}` }])
      } else {
        const answer = (data && (data.answer || data)) || '[No answer]'
        // Try to parse the answer into Email / Agenda / Summary sections
        const parsed = typeof answer === 'string' ? parseOutreach(answer) : null
        if (parsed && (parsed.email || parsed.agenda || parsed.summary)) {
          const cards = []
          if (parsed.email) cards.push({ role: 'assistant', type: 'card', cardType: 'email', title: 'Email', content: parsed.email.trim() })
          if (parsed.agenda) cards.push({ role: 'assistant', type: 'card', cardType: 'agenda', title: 'Agenda', content: parsed.agenda.trim() })
          if (parsed.summary) cards.push({ role: 'assistant', type: 'card', cardType: 'summary', title: 'Status Summary', content: parsed.summary.trim() })
          if (cards.length) {
            setAiChatMessages(m => [...m, ...cards])
          } else {
            setAiChatMessages(m => [...m, { role: 'assistant', text: `Generated outreach artifacts for "${short}":\n\n${String(answer)}` }])
          }
        } else {
          setAiChatMessages(m => [...m, { role: 'assistant', text: `Generated outreach artifacts for "${short}":\n\n${String(answer)}` }])
        }
        // open the assistant panel so user sees result
        setAiPanelVisible(true)
        setAiMinimized(false)
      }
    } catch (err) {
      setAiChatMessages(m => [...m, { role: 'assistant', text: 'Error generating artifacts: ' + String(err) }])
    } finally {
      setAiGeneratingId(null)
    }
  }

  // human-friendly timestamp + relative time
  function formatWhen(iso) {
    try {
      const d = new Date(iso)
      const now = Date.now()
      const diff = Math.round((now - d.getTime()) / 1000)
      if (diff < 60) return `${d.toLocaleString()} (${diff}s ago)`
      if (diff < 3600) return `${d.toLocaleString()} (${Math.round(diff/60)}m ago)`
      if (diff < 86400) return `${d.toLocaleString()} (${Math.round(diff/3600)}h ago)`
      return `${d.toLocaleString()} (${Math.round(diff/86400)}d ago)`
    } catch (e) { return String(iso) }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
        if (!token) {
          try { router.replace('/signin') } catch (e) {}
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

  // attach global listeners for dragging the AI panel
  useEffect(() => {
    function onMove(e) {
      if (!aiDragRef.current.dragging) return
      const dx = e.clientX - aiDragRef.current.startX
      const dy = e.clientY - aiDragRef.current.startY
      const left = Math.max(8, aiDragRef.current.origLeft + dx)
      const top = Math.max(8, aiDragRef.current.origTop + dy)
      setAiPos({ left, top })
    }
    function onUp() { aiDragRef.current.dragging = false }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
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
        <div style={{width:84, height:84, borderRadius:999, border:'8px solid rgba(var(--color-neon-rgb),0.06)', borderTopColor:'var(--color-neon)', boxShadow:'0 0 30px rgba(var(--color-neon-rgb),0.08)', margin:'0 auto', animation:'spin 1s linear infinite'}} />
        <div style={{color:'var(--color-neon)', marginTop:14, fontSize:16}}>Loading dashboard...</div>
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
            // navigate immediately to signin after clearing state to avoid flashing dashboard
            try { router.replace('/signin') } catch (e) { console.warn('router.replace failed during sign-out', e); try { window.location.href = '/signin' } catch (err) { console.warn('Fallback redirect failed', err) } }
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
                  <div style={{fontSize:22, color:'var(--color-neon)', fontWeight:700}}>{selectedPartner.health || '—'}</div>
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
                    <div style={{fontWeight:700, color:'var(--color-neon)'}}>Recent Interactions</div>
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
                    <div style={{display:'flex', gap:8, alignItems:'center'}}>
                      {overdue && (<div style={{fontSize:12,color:'#ff4d4f',fontWeight:700}}>Overdue · {overdueDays(t.due)}d</div>)}
                    </div>
                </div>
                <div style={{fontSize:13, color:'#bbb', marginTop:6}}>{t.note}</div>
                <div style={{fontSize:12, color: overdue ? '#ffb3b3' : '#ffd57a', marginTop:6}}>Due: {t.due}</div>
              </div>
            )})
          )}
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          <div style={{padding:14, border:'1px solid rgba(255,255,255,0.03)', borderRadius:8}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div style={{fontWeight:700, color:'var(--color-neon)'}}>Recent Activity</div>
              <div>
                <button className="btn" onClick={async ()=>{
                  setLogsLoading(true)
                  try {
                    const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
                    const res = await fetch('/api/seed', { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{} ) } })
                    if (res.ok) {
                      const sd = await res.json()
                      const normRecent = (sd.recentActivity || []).map((it, i) => ({ id: it.id || `r${i+1}`, partner: it.partner || it.title || it.name || '', text: it.text || it.note || '', date: it.date || it.at || '' }))
                      setRecentActivity(normRecent)
                    }
                  } catch (e) { console.warn('Refresh failed', e) } finally { setLogsLoading(false) }
                }} disabled={logsLoading}>{logsLoading ? 'Loading…' : 'Refresh'}</button>
              </div>
            </div>
            {recentActivity.map(r => (
              <div key={r.id} style={{marginTop:10}}>
                <div style={{fontWeight:700, lineHeight:1.2}}>{r.partner} <span style={{fontSize:12, color:'#bbb', marginLeft:8}}>{formatWhen(r.date)}</span></div>
                <div style={{fontSize:13, color:'#bbb', whiteSpace:'pre-wrap', marginTop:6}}>{r.text}</div>
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
                    <div style={{display:'flex', gap:12, alignItems:'center'}}>
                      <div style={{width:36, height:36, borderRadius:18, background:'#111', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'var(--color-neon)'}}>
                        {(() => {
                          const name = (f.support && f.support[0] && f.support[0].name) || f.assigned || ''
                          const parts = String(name || '').trim().split(' ').filter(Boolean)
                          if (parts.length === 0) return '—'
                          if (parts.length === 1) return parts[0].slice(0,2).toUpperCase()
                          return (parts[0][0] + parts[1][0]).toUpperCase()
                        })()}
                      </div>
                      <div>
                        <div style={{fontWeight:700}}>{f.campaign?.name || f.name}</div>
                        <div style={{fontSize:12, color:'#bbb'}}>{f.note || `${f.days}+ days since contact`}</div>
                        {f.assignedRole && <div style={{fontSize:12, color:'#9ea', marginTop:6}}>Assigned Role: {f.assignedRole}</div>}
                        {f.support && f.support.length > 0 && (
                          <div style={{fontSize:12, color:'#9ea', marginTop:4}}>Support: {f.support.map(s => s.name + (s.role ? ` — ${s.role}` : '')).join(', ')}</div>
                        )}
                      </div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
                      <div style={{width:10, height:10, borderRadius:10, background:(f.days && f.days > 60) ? '#ff4d4f' : '#ffcc00'}} />
                      {/* outreach now handled via chat; button removed */}
                      <button className="btn btn-link" onClick={async () => {
                        // Try to link to a campaign detail page first (by name match)
                        try {
                          const qname = (f.campaign?.name || f.name || '').toLowerCase().trim()
                          if (qname) {
                            const res = await fetch('/api/campaigns')
                            if (res.ok) {
                              const data = await res.json()
                              const list = Array.isArray(data.campaigns) ? data.campaigns : []
                              // try exact name match first, then partial
                              let found = list.find(c => (c.name || '').toLowerCase().trim() === qname)
                              if (!found) found = list.find(c => (c.name || '').toLowerCase().includes(qname.split(' ')[0]))
                              if (found) {
                                try { router.push(`/campaigns/${found.id}`); return } catch (e) { /* fall through */ }
                              }
                            }
                          }
                        } catch (err) {
                          console.warn('Campaign lookup failed', err)
                        }

                        // fallback: try to find a related partner by name
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

          {/* Assistant floating panel (draggable, minimizable, downloadable) */}
          {!aiPanelVisible && (
            <button
              title="Open Assistant"
              onClick={() => setAiPanelVisible(true)}
              style={{position:'fixed', right:20, bottom:20, zIndex:9998, width:52, height:52, borderRadius:26, background:'var(--color-neon)', color:'#000', fontWeight:800, boxShadow:'0 8px 24px rgba(0,0,0,0.4)', border:'none', cursor:'pointer'}}
            >AI</button>
          )}

          {aiPanelVisible && (
              <div
              role="dialog"
              aria-label="Team Assistant"
              style={{
                position: 'fixed',
                zIndex: 9999,
                width: aiMinimized ? 280 : 640,
                height: aiMinimized ? 48 : 'auto',
                  left: aiPos.left != null ? aiPos.left : undefined,
                  top: aiPos.top != null ? aiPos.top : undefined,
                  right: aiPos.left == null ? 20 : undefined,
                  bottom: aiPos.top == null ? 20 : undefined,
                  background: 'var(--color-off-black)',
                  border: '1px solid rgba(255,255,255,0.04)',
                padding: aiMinimized ? '6px 10px' : 14,
                  borderRadius: 8,
                  boxShadow: '0 8px 40px rgba(0,0,0,0.6)'
                }}
            >
              <div
                onMouseDown={(e)=>{
                  aiDragRef.current.dragging = true
                  aiDragRef.current.startX = e.clientX
                  aiDragRef.current.startY = e.clientY
                  // Find the dialog container reliably (works when minimized or DOM changes)
                  const container = e.currentTarget.closest('[role="dialog"]') || e.currentTarget.parentElement
                  const rect = container.getBoundingClientRect()
                  aiDragRef.current.origLeft = rect.left
                  aiDragRef.current.origTop = rect.top
                  // Ensure aiPos has initial coordinates so restoring/minimizing doesn't flip anchors
                  if (aiPos.left == null || aiPos.top == null) {
                    try { setAiPos({ left: Math.max(8, rect.left), top: Math.max(8, rect.top) }) } catch (err) { /* ignore */ }
                  }
                  e.preventDefault()
                }}
                style={{display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'grab', overflow: aiMinimized ? 'visible' : 'hidden', background: aiMinimized ? 'var(--color-off-black)' : 'transparent', padding: aiMinimized ? '6px 10px' : 0, borderRadius: aiMinimized ? 6 : 0}}
              >
                {!aiMinimized ? (
                  <>
                    <div style={{fontWeight:700, color:'var(--color-neon)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth: aiMinimized ? 180 : 'unset'}}>Team Assistant</div>
                    <div style={{display:'flex', gap:8, alignItems:'center'}}>
                      <button className="btn" onClick={(e)=>{ e.stopPropagation();
                        const payload = { messages: aiChatMessages, user: user || null }
                        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `team-assistant-${Date.now()}.json`
                        a.click()
                        URL.revokeObjectURL(url)
                      }} style={ aiMinimized ? { padding: '6px 8px', fontSize:12, minWidth:0 } : {} }>Download</button>
                      <button className="btn btn-ghost" onClick={(e)=>{ e.stopPropagation(); if (confirm('Clear Assistant chat history? This cannot be undone.')) { setAiChatMessages([]); try { localStorage.removeItem('team_ai_messages') } catch (err) {} } }} style={ aiMinimized ? { padding: '6px 8px', fontSize:12, minWidth:0 } : {} }>Clear</button>
                      <button className="btn btn-ghost" onClick={(e)=>{ e.stopPropagation(); setAiMinimized(prev => { const next = !prev; if (next) { setAiPos({ left: null, top: null }) } return next }) }} style={ aiMinimized ? { padding: '6px 8px', fontSize:12, minWidth:0 } : {} }>{aiMinimized ? 'Restore' : 'Minimize'}</button>
                      <button className="btn btn-ghost" onClick={(e)=>{ e.stopPropagation(); setAiPanelVisible(false) }} style={ aiMinimized ? { padding: '6px 8px', fontSize:12, minWidth:0 } : {} }>Close</button>
                    </div>
                  </>
                ) : (
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%'}}>
                    <div style={{fontWeight:700, color:'var(--color-neon)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:180}}>Team Assistant</div>
                    <div style={{display:'flex', gap:8, alignItems:'center'}}>
                      <button
                        className="btn"
                        onClick={(e)=>{ e.stopPropagation(); const payload = { messages: aiChatMessages, user: user || null }; const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `team-assistant-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url); }}
                        style={ aiMinimized ? { padding: '6px 8px', fontSize:12, minWidth:0, background: '#171717', color: '#ddd', border: '1px solid rgba(255,255,255,0.06)' } : {} }
                      >{ aiMinimized ? 'JSON' : 'Download JSON' }</button>
                      <button className="btn btn-ghost" onClick={(e)=>{ e.stopPropagation(); setAiMinimized(m => !m) }} style={ aiMinimized ? { padding: '6px 8px', fontSize:12, minWidth:0, background: '#171717', color: '#ddd', border: '1px solid rgba(255,255,255,0.06)' } : {} }>{aiMinimized ? 'Restore' : 'Minimize'}</button>
                      <button className="btn btn-ghost" onClick={(e)=>{ e.stopPropagation(); if (confirm('Clear Assistant chat history? This cannot be undone.')) { setAiChatMessages([]); try { localStorage.removeItem('team_ai_messages') } catch (err) {} } }} style={ aiMinimized ? { padding: '6px 8px', fontSize:12, minWidth:0, background: '#171717', color: '#ddd', border: '1px solid rgba(255,255,255,0.06)' } : {} }>Clear</button>
                      <button className="btn btn-ghost" onClick={(e)=>{ e.stopPropagation(); setAiPanelVisible(false) }} style={ aiMinimized ? { padding: '6px 8px', fontSize:12, minWidth:0, background: '#171717', color: '#ddd', border: '1px solid rgba(255,255,255,0.06)' } : {} }>Close</button>
                    </div>
                  </div>
                )}
              </div>

              {!aiMinimized && (
                <div style={{marginTop:8, maxHeight:'70vh', overflow:'auto', minWidth:420}}>
                  <div style={{maxHeight:340, overflow:'auto', padding:12, background:'#070707', borderRadius:8}}>
                    {aiChatMessages.length === 0 && !aiQuestionLoading ? (
                      <div style={{color:'#8a8a8a', fontSize:13}}>Ask a question about your dashboard and the assistant will respond.</div>
                    ) : (
                      <div>
                        {aiChatMessages.map((m, idx) => (
                          <div key={idx} style={{marginBottom:12}}>
                            {m.type === 'card' ? (
                              <div style={{border:'1px solid rgba(255,255,255,0.04)', padding:12, borderRadius:8, background:'#071017'}}>
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                  <div style={{fontSize:13, color:'#999'}}>{m.role === 'user' ? 'You' : 'Assistant'}</div>
                                  <div style={{fontWeight:800, color:'var(--color-neon)'}}>{m.title}</div>
                                </div>
                                <div style={{marginTop:8, color:'#cfe', fontSize:14, whiteSpace:'pre-wrap', lineHeight:1.6}}>{m.content}</div>
                              </div>
                            ) : (
                              <>
                                <div style={{fontSize:13, color:'#999', marginBottom:6}}>{m.role === 'user' ? 'You' : 'Assistant'}</div>
                                <div style={{color: m.role === 'user' ? '#fff' : '#cfe', fontSize:15, lineHeight:1.6, whiteSpace:'pre-wrap', wordBreak:'break-word'}}>{m.text}</div>
                              </>
                            )}
                          </div>
                        ))}
                        {aiQuestionLoading && (
                          <div style={{display:'flex', alignItems:'center', gap:8, marginTop:6, color:'#bbb'}}>
                            <span className="spinner" aria-hidden="true"></span>
                            <span style={{fontSize:13}}>Assistant is thinking…</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{display:'flex', gap:8, marginTop:10, alignItems:'center'}}>
                    <input className="input" style={{fontSize:15, padding:'10px 12px'}} value={aiQuestion} onChange={e=>setAiQuestion(e.target.value)} placeholder="Ask a question..." />
                    <button className={"btn" + (aiQuestionLoading ? ' loading' : '')} style={{padding:'10px 14px'}} onClick={async ()=>{
                      const q = (aiQuestion||'').trim()
                      if (!q) return
                      setAiChatMessages(m => [...m, { role: 'user', text: q }])
                      setAiQuestion('')
                      setAiQuestionLoading(true)
                      try {
                        // If the user's question looks like an outreach request, route it into the outreach generator
                        const outreachKeywords = ['outreach','email','agenda','status summary','status','one-page','one page','follow-up','follow up','re-engage','reengage']
                        const qLower = q.toLowerCase()
                        const isOutreach = outreachKeywords.some(k => qLower.includes(k))
                        if (isOutreach) {
                          await handleOutreachFromChat(q)
                          return
                        }

                        const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
                        const ctx = { tasks, followUps, partners, recentActivity, user }
                        const res = await fetch('/api/team/ai-question', { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{} ) }, body: JSON.stringify({ question: q, context: ctx }) })
                        const data = await res.json().catch(()=>null)
                        // friendly handling for quota/key issues
                        if (!res.ok) {
                          if (data?.code === 'insufficient_quota') {
                            setAiChatMessages(m => [...m, { role: 'assistant', text: 'Assistant temporarily unavailable — our AI quota is exhausted. Please contact the admin to update billing.' }])
                          } else if (data?.code === 'invalid_api_key') {
                            setAiChatMessages(m => [...m, { role: 'assistant', text: 'Assistant misconfigured — AI key invalid. Please contact the admin.' }])
                          } else {
                            setAiChatMessages(m => [...m, { role: 'assistant', text: 'Error: ' + (data?.message || data?.error || 'Request failed') }])
                          }
                        } else {
                          setAiChatMessages(m => [...m, { role: 'assistant', text: data?.answer || '[No answer]' }])
                        }
                      } catch (err) {
                        setAiChatMessages(m => [...m, { role: 'assistant', text: 'Error: ' + String(err) }])
                      } finally {
                        setAiQuestionLoading(false)
                      }
                    }} disabled={aiQuestionLoading}>{aiQuestionLoading ? (<><span className="spinner" style={{marginRight:8}}></span>Thinking…</>) : 'Send'}</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
