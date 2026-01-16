import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function PartnerPage() {
  const router = useRouter()
  const { slug } = router.query
  const [loading, setLoading] = useState(true)
  const [partner, setPartner] = useState(null)
  const [error, setError] = useState(null)
  const [selectedTab, setSelectedTab] = useState('contacts')

  const [newReminderTitle, setNewReminderTitle] = useState('')
  const [newReminderDue, setNewReminderDue] = useState('')
  const [newReminderNote, setNewReminderNote] = useState('')

  useEffect(() => {
    if (!slug) return
    let mounted = true
    ;(async () => {
      try {
        const token = (() => { try { return localStorage.getItem('token') } catch(e){ return null } })()
        const res = await fetch('/api/seed', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : undefined } })
        if (!res.ok) {
          setError('Failed to load partner data')
          return
        }
        const sd = await res.json()
        const list = sd.partners || []
        const matched = list.find(p => {
          const s = (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
          return s === String(slug)
        })
        if (!matched) {
          setError('Partner not found')
          return
        }
        if (mounted) setPartner(matched)
      } catch (e) {
        setError('Network error')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [slug])

  // deep-link support: allow ?tab=interactions|reminders|contacts|programs
  useEffect(() => {
    const t = router.query?.tab
    if (t && ['contacts','interactions','programs','reminders'].includes(String(t))) {
      setSelectedTab(String(t))
    }
  }, [router.query?.tab])

  if (loading) return (
    <div style={{position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#000', zIndex:9999}}>
      <div style={{textAlign:'center'}}>
          <div style={{width:84, height:84, borderRadius:999, border:'8px solid rgba(var(--color-neon-rgb),0.06)', borderTopColor:'var(--color-neon)', boxShadow:'0 0 30px rgba(var(--color-neon-rgb),0.08)', margin:'0 auto', animation:'spin 1s linear infinite'}} />
          <div style={{color:'var(--color-neon)', marginTop:14, fontSize:16}}>Loading partner details...</div>
      </div>
      <style jsx>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (error) return (
    <div style={{padding:20,color:'#f66'}}>
      {error}
      <div style={{marginTop:12}}><button className="btn" onClick={() => router.push('/team')}>Back to Dashboard</button></div>
    </div>
  )

  return (
    <div style={{padding:20}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <button className="btn btn-ghost" onClick={() => router.push('/team')}>← Back to Dashboard</button>
        </div>
        <div style={{display:'flex', gap:12}}>
          <button className="btn btn-ghost" onClick={() => router.push('/team')}>← Back to Dashboard</button>
          <button className="btn btn-ghost" onClick={() => {
            try { localStorage.removeItem('token') } catch(e){ console.warn('removeItem token failed', e) }
            try { router.replace('/') } catch(e) { try { window.location.href = '/' } catch(err) { console.warn('redirect failed', err) } }
          }}>Logout</button>
        </div>
      </div>

      <div style={{marginTop:16, padding:18, border:'1px solid rgba(57,255,20,0.12)', borderRadius:8}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <div style={{fontSize:18, fontWeight:800}}>{partner.name}</div>
            <div style={{marginTop:6}}>
              <span style={{background:'#0b0b0b',borderRadius:6,padding:'4px 8px',border:'1px solid rgba(57,255,20,0.08)',color:'#39ff14',fontWeight:700,fontSize:12,marginRight:8}}>{partner.tag}</span>
              <span style={{color:'#bbb',marginLeft:6}}>{partner.description}</span>
              {partner.owners && partner.owners.length > 0 && (
                <div style={{marginTop:8,fontSize:12,color:'#9ea'}}>
                  {partner.owners.length === 1 ? 'Assigned: ' : 'Team: '}
                  {partner.owners.map((email, idx) => {
                    const match = (partner.contacts || []).find(c => c.email === email)
                    const label = match ? `${match.name}${match.title ? ` — ${match.title}` : ''}` : email
                    return (
                      <span key={email} style={{marginLeft: idx ? 8 : 0}}>{label}{idx < partner.owners.length - 1 ? ',' : ''}</span>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:12,color:'#bbb'}}>Partnership Health</div>
            <div style={{fontSize:28,color:'#39ff14',fontWeight:800}}>{partner.health || '—'}</div>
          </div>
        </div>

        <hr style={{border:'none',borderTop:'1px solid rgba(57,255,20,0.06)',margin:'16px 0'}} />

        <div style={{display:'flex',gap:24}}>
          <div style={{flex:1}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
              <div>
                <div style={{fontSize:12,color:'#bbb'}}>Contract Value</div>
                <div style={{fontWeight:700,marginTop:6}}>{partner.contractValue || '—'}</div>
              </div>
              <div>
                <div style={{fontSize:12,color:'#bbb'}}>Start Date</div>
                <div style={{fontWeight:700,marginTop:6}}>{partner.startDate || '—'}</div>
              </div>
              <div>
                <div style={{fontSize:12,color:'#bbb'}}>End Date</div>
                <div style={{fontWeight:700,marginTop:6}}>{partner.endDate || '—'}</div>
              </div>
              <div>
                <div style={{fontSize:12,color:'#bbb'}}>Last Contact</div>
                <div style={{fontWeight:700,marginTop:6}}>{partner.lastContact || '—'}</div>
              </div>
            </div>

            <div style={{marginTop:18}}>
                        <span style={{color:'#bbb',marginLeft:6}}>{partner.description}</span>
                {['contacts','interactions','programs','reminders'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    style={{
                      padding:'8px 12px',
                      borderRadius:8,
                      border: selectedTab === tab ? '1px solid #39ff14' : '1px solid rgba(255,255,255,0.03)',
                      background: selectedTab === tab ? 'rgba(57,255,20,0.02)' : 'transparent',
                      color: selectedTab === tab ? '#39ff14' : '#bbb',
                      cursor: 'pointer'
                    }}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} ({(partner[tab]||[]).length})
                  </button>
                ))}
                      <div style={{fontSize:28,color:'var(--color-neon)',fontWeight:800}}>{partner.health || '—'}</div>

              <div style={{marginTop:12}}>
                {selectedTab === 'contacts' && (
                  <div style={{padding:12,border:'1px solid rgba(57,255,20,0.06)',borderRadius:6}}>
                    <div style={{fontWeight:700,color:'#39ff14'}}>Contacts</div>
                    {(partner.contacts || []).map((c, i) => (
                      <div key={i} style={{marginTop:10}}>
                        <div style={{fontWeight:700}}>{c.name}</div>
                        <div style={{color:'#bbb',marginTop:6}}>{c.title}</div>
                        <div style={{color:'#bbb',marginTop:6}}>{c.email} · {c.phone}</div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTab === 'interactions' && (
                  <div style={{marginTop:12,padding:12,border:'1px solid rgba(57,255,20,0.06)',borderRadius:6}}>
                    <div style={{fontWeight:700,color:'#39ff14'}}>Engagement History</div>
                    {(partner.interactions||[]).map(it => (
                      <div key={it.id || it.date} style={{marginTop:10}}>
                        <div style={{fontWeight:700}}>{it.type || it.kind} <span style={{fontSize:12,color:'#bbb',marginLeft:8}}>{it.date}</span></div>
                        <div style={{color:'#bbb',marginTop:6}}>{it.note || it.text}</div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTab === 'programs' && (
                  <div style={{marginTop:12,padding:12,border:'1px solid rgba(57,255,20,0.06)',borderRadius:6}}>
                    <div style={{fontWeight:700,color:'#39ff14'}}>Programs & Contracts</div>
                    {(partner.programs||[]).map(pr => (
                      <div key={pr.id || pr.title} style={{marginTop:10}}>
                        <div style={{fontWeight:700}}>{pr.title} <span style={{fontSize:12,color:'#bbb',marginLeft:8}}>{pr.status}</span></div>
                        <div style={{color:'#bbb',marginTop:6}}>{pr.value ? pr.value : ''} {pr.start ? `· ${pr.start} - ${pr.end}` : ''}</div>
                      </div>
                                border: selectedTab === tab ? '1px solid var(--color-neon)' : '1px solid rgba(255,255,255,0.03)',
                                color: selectedTab === tab ? 'var(--color-neon)' : '#bbb',
                )}

                {selectedTab === 'reminders' && (
                  <div style={{marginTop:12,padding:12,border:'1px solid rgba(57,255,20,0.06)',borderRadius:6}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div style={{fontWeight:700,color:'#39ff14'}}>Reminders & Tasks</div>
                      <div style={{fontSize:12,color:'#bbb'}}>Local only — non-persistent</div>
                    </div>
                    {(partner.reminders||[]).map(rm => (
                      <div key={rm.id} style={{marginTop:10}}>
                        <div style={{fontWeight:700}}>{rm.title} <span style={{fontSize:12,color:'#bbb',marginLeft:8}}>Due: {rm.due}</span></div>
                        <div style={{color:'#bbb',marginTop:6}}>{rm.note}</div>
                      </div>
                    ))}

                    <div style={{marginTop:14,borderTop:'1px dashed rgba(255,255,255,0.03)',paddingTop:12}}>
                      <div style={{fontSize:13,color:'#bbb',marginBottom:8}}>Add a local reminder (client-only)</div>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        <input value={newReminderTitle} onChange={e => setNewReminderTitle(e.target.value)} placeholder="Title" style={{flex:1,padding:8,borderRadius:6,border:'1px solid rgba(57,255,20,0.04)',background:'#0b0b0b',color:'#eee'}} />
                        <input value={newReminderDue} onChange={e => setNewReminderDue(e.target.value)} placeholder="Due (YYYY-MM-DD)" style={{width:160,padding:8,borderRadius:6,border:'1px solid rgba(57,255,20,0.04)',background:'#0b0b0b',color:'#eee'}} />
                      </div>
                      <div style={{marginTop:8,display:'flex',gap:8}}>
                        <input value={newReminderNote} onChange={e => setNewReminderNote(e.target.value)} placeholder="Note" style={{flex:1,padding:8,borderRadius:6,border:'1px solid rgba(57,255,20,0.04)',background:'#0b0b0b',color:'#eee'}} />
                        <button className="btn" onClick={() => {
                          if (!newReminderTitle) return alert('Please add a title')
                          const id = `local-${Date.now()}`
                          const r = { id, title: newReminderTitle, due: newReminderDue || 'TBD', note: newReminderNote }
                          setPartner(prev => ({ ...prev, reminders: [ ...(prev.reminders || []), r ] }))
                          setNewReminderTitle('')
                          setNewReminderDue('')
                          setNewReminderNote('')
                        }}>Add</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
