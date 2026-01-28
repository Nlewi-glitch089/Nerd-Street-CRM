import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function Profile() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)

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
        if (mounted) setUser(data.user)
      } catch (err) {
        if (mounted) setError('Network error')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) return (
    <div style={{position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#000', zIndex:9999}}>
      <div style={{textAlign:'center', transform:'translateY(-6%)'}}>
        <div className="spinner" />
        <div style={{color:'#bbb', marginTop:14, fontSize:16}}>Loading profile...</div>
      </div>
      <style jsx>{`
        .spinner { width:88px; height:88px; border-radius:50%; border:8px solid rgba(255,255,255,0.03); border-top-color: var(--color-neon); box-shadow: 0 0 28px rgba(var(--color-neon-rgb),0.08); animation: spin 1s linear infinite; margin:0 auto }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
  if (error) return <div style={{padding:20, color:'red'}}>{error}</div>

  return (
    <div style={{padding:18}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
        <div>
          <div style={{color:'var(--color-neon)', fontWeight:800, fontSize:18}}>Profile</div>
          <div style={{color:'#bbb'}}>View and manage your account</div>
        </div>
        <div style={{display:'flex', gap:12}}>
          <button className="btn btn-ghost" onClick={() => { try { router.back() } catch(e){ console.warn('nav failed', e) } }}>Back</button>
        </div>
      </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 320px', gap:18}}>
        <div style={{padding:18, border:'1px solid rgba(255,255,255,0.03)', borderRadius:8}}>
          <div style={{maxWidth:640}}>
            <div style={{fontWeight:700, color:'var(--color-neon)', marginBottom:8}}>Account details</div>
            <div style={{display:'grid', gridTemplateColumns:'140px 1fr', gap:12, alignItems:'center'}}>
              <div style={{color:'#bbb'}}>Name</div>
                <div style={{fontWeight:700}}>{user?.name || '-'}</div>

              <div style={{color:'#bbb'}}>Email</div>
              <div style={{fontWeight:700}}>{user?.email || '-'}</div>

              <div style={{color:'#bbb'}}>Role</div>
              <div style={{fontWeight:700}}>{user?.role || '-'}</div>

              <div style={{color:'#bbb'}}>ID</div>
              <div style={{fontSize:12, color:'#999'}}>{user?.id || '-'}</div>
            </div>
            <RequestAccessForm userEmail={user?.email} />
          </div>
        </div>

        <div style={{padding:18, border:'1px solid rgba(255,255,255,0.03)', borderRadius:8}}>
          <div style={{fontWeight:700, color:'var(--color-neon)', marginBottom:8}}>Edit profile</div>
          <div style={{color:'#bbb', marginBottom:10, fontSize:13}}>Update your display name or change your password using the form on this panel.</div>
          <ProfileEditor initialName={user?.name} />
        </div>
      </div>

      {/* Recent activity removed from Profile - team dashboard shows activity instead */}
    </div>
  )
}

function RecentActivityList(){
  // lightweight local sample; try server seed if available
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [fromCache, setFromCache] = useState(false)
  const CACHE_KEY = 'seed_recent_activity'
  const MAX_AGE_MS = 5 * 60 * 1000 // 5 minutes
  useEffect(()=>{
    let mounted = true
    ;(async()=>{
      setLoading(true)
      // try cache first
      try{
        const raw = localStorage.getItem(CACHE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed && parsed.items && parsed.ts) {
            const age = Date.now() - parsed.ts
            if (age <= MAX_AGE_MS) {
              if (mounted) {
                setItems(parsed.items)
                setFromCache(true)
                setLoading(false)
              }
            }
          }
        }
      }catch(e){ /* ignore cache parse errors */ }

      // fetch fresh data in background with timeout
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 6000)
      try{
        const token = (()=>{ try{ return localStorage.getItem('token') }catch(e){return null} })()
        const res = await fetch('/api/seed', { signal: controller.signal })
        if (res.ok){
          const d = await res.json().catch(()=>null)
          if (mounted) {
            const recent = d?.recentActivity || []
            setItems(recent)
            setFromCache(false)
            try { localStorage.setItem(CACHE_KEY, JSON.stringify({ items: recent, ts: Date.now() })) } catch(e) {}
          }
        } else if (mounted && !fromCache) {
          setItems([{ id:'r1', title:'No recent server activity', note:'No items returned' }])
        }
      }catch(e){
        // if aborted or network error and we don't have cache, show fallback
        if (mounted && !fromCache) setItems([{ id:'r2', title:'Local sample activity', note:'Nothing to show from server' }])
      }finally{ clearTimeout(timeout); if (mounted) setLoading(false) }
    })()
    return ()=>{ mounted=false }
  },[])
  if (loading && !fromCache) return (
    <div style={{display:'flex', flexDirection:'column', gap:8}}>
      {[1,2,3].map(n => (
        <div key={n} style={{height:56, borderRadius:6, background:'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', border:'1px solid rgba(255,255,255,0.02)'}} />
      ))}
    </div>
  )
  if (!items || items.length === 0) return <div style={{color:'#888'}}>No recent activity</div>
  return (
    <div style={{display:'flex', flexDirection:'column', gap:10}}>
      {fromCache && <div style={{fontSize:12,color:'#999'}}>Showing cached activity - updating...</div>}
      {items.map((r,i)=> (
        <div key={r.id || i} style={{padding:10, border:'1px solid rgba(255,255,255,0.03)', borderRadius:6}}>
          <div style={{fontWeight:700}}>{r.title || r.partner || r.title}</div>
          <div style={{fontSize:13, color:'#bbb'}}>{r.note || r.kind || ''}</div>
          <div style={{fontSize:12, color:'#999', marginTop:6}}>{r.date || ''}</div>
        </div>
      ))}
    </div>
  )
}

function ProfileEditor({ initialName }){
  const [name, setName] = useState(initialName || '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  async function submit(e){
    if (e && e.preventDefault) e.preventDefault()
    setMessage(null)
    if (password && password.length < 8) return setMessage({ type:'error', text: 'Password must be at least 8 characters' })
    if (password && password !== confirm) return setMessage({ type:'error', text: 'Password and confirmation do not match' })
    setLoading(true)
    try{
      const token = (()=>{ try{ return localStorage.getItem('token') }catch(e){return null} })()
      const body = { name: name || undefined }
      if (password) body.password = password
      const res = await fetch('/api/auth/update', { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{} ) }, body: JSON.stringify(body) })
      const d = await res.json().catch(()=>null)
      if (!res.ok) throw new Error(d?.error || 'Update failed')
      setMessage({ type:'success', text: 'Profile updated' })
      setPassword(''); setConfirm('')
    }catch(err){ setMessage({ type:'error', text: String(err.message || err) }) }
    finally{ setLoading(false) }
  }

  return (
    <form onSubmit={submit}>
      <div style={{display:'grid', gap:8}}>
        <label style={{fontSize:12, color:'#bbb'}}>Display name</label>
        <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" autoComplete="name" />

        <label style={{fontSize:12, color:'#bbb', marginTop:8}}>New password</label>
        <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Leave blank to keep current" autoComplete="new-password" />

        <label style={{fontSize:12, color:'#bbb'}}>Confirm password</label>
        <input className="input" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirm new password" autoComplete="new-password" />

        <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:8}}>
          <button className="btn btn-ghost" type="button" onClick={()=>{ setName(initialName || ''); setPassword(''); setConfirm(''); setMessage(null) }}>Reset</button>
          <button className="btn" type="submit" disabled={loading}>{loading? 'Saving...' : 'Save changes'}</button>
        </div>

        {message && <div style={{marginTop:8, color: message.type === 'error' ? '#ff8080' : 'var(--color-neon)'}}>{message.text}</div>}
      </div>
    </form>
  )
}

function RequestAccessForm({ userEmail }){
  const [open, setOpen] = useState(false)
  const [scope, setScope] = useState('This partner only')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [existing, setExisting] = useState(null)

  useEffect(()=>{
    let mounted = true
    if (!userEmail) return
    ;(async()=>{
      try{
        const res = await fetch(`/api/admin/request-access?email=${encodeURIComponent(userEmail)}`)
        if (!res.ok) return
        const d = await res.json().catch(()=>null)
        if (mounted && d && d.requests && d.requests.length) {
          setExisting(d.requests[0])
        }
      }catch(e){}
    })()
    return ()=>{ mounted = false }
  },[userEmail])

  async function submit(e){
    e && e.preventDefault && e.preventDefault()
    setMessage(null)
    if (!scope) return setMessage({ type: 'error', text: 'Please choose a scope' })
    setLoading(true)
    try{
      const res = await fetch('/api/admin/request-access', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ email: userEmail, scope, note }) })
      const d = await res.json().catch(()=>null)
      if (!res.ok) throw new Error(d?.error || 'Request failed')
      setMessage({ type: 'success', text: d?.message || 'Request sent' })
      // reflect created request in UI
      if (d?.request) setExisting(d.request)
      setOpen(false)
      setNote('')
    }catch(err){ setMessage({ type:'error', text: String(err.message || err) }) }
    finally{ setLoading(false) }
  }

  return (
    <div style={{marginTop:12}}>
      <div style={{fontSize:12, color:'#bbb', marginBottom:8}}>Need temporary, limited admin access for a specific task? Request it here.</div>
      {!open ? (
        <div style={{display:'flex', gap:8}}>
          <button className="btn btn-ghost" onClick={() => setOpen(true)}>Request Temporary Access</button>
        </div>
      ) : (
        <form onSubmit={submit} style={{display:'grid', gap:8}}>
          <label style={{fontSize:12, color:'#bbb'}}>Scope</label>
          <select value={scope} onChange={e=>setScope(e.target.value)} style={{padding:8,borderRadius:6,background:'#0b0b0b',color:'#eee',border:'1px solid rgba(255,255,255,0.03)'}}>
            <option>This partner only</option>
            <option>This campaign only</option>
            <option>Specific tasks only</option>
          </select>
          <label style={{fontSize:12, color:'#bbb'}}>Reason / details</label>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Why do you need temporary access?" rows={3} style={{padding:8,borderRadius:6,background:'#0b0b0b',color:'#eee',border:'1px solid rgba(255,255,255,0.03)'}} />
          <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
            <button type="button" className="btn btn-ghost" onClick={() => { setOpen(false); setNote(''); setMessage(null) }}>Cancel</button>
            <button className="btn" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send request'}</button>
          </div>
        </form>
      )}
      {message && <div style={{marginTop:8,color: message.type === 'error' ? '#ff8080' : 'var(--color-neon)'}}>{message.text}</div>}
      {existing && (
        <div style={{marginTop:10, padding:10, border:'1px solid rgba(255,255,255,0.03)', borderRadius:6}}>
          <div style={{fontSize:13, fontWeight:700}}>Latest request</div>
          <div style={{fontSize:13, color:'#bbb'}}>Status: <span style={{color: existing.status === 'PENDING' ? '#ffb86b' : 'var(--color-neon)'}}>{existing.status}</span></div>
          <div style={{fontSize:12, color:'#999', marginTop:6}}>Submitted: {existing.createdAt ? new Date(existing.createdAt).toLocaleString() : ''}</div>
          <div style={{fontSize:12, color:'#999'}}>Admins typically review requests within 24 hours.</div>
        </div>
      )}
    </div>
  )
}


