import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function AdminRequests() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [requests, setRequests] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
      if (!token) return router.replace('/signin')
      try {
        const res = await fetch('/api/protected', { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) { localStorage.removeItem('token'); return router.replace('/signin') }
        const data = await res.json()
        if (!mounted) return
        setUser(data.user || null)
        if (data?.user?.role !== 'ADMIN') return router.replace('/signin')
      } catch (e) {
        return router.replace('/signin')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  async function load() {
    setRefreshing(true)
    try {
      const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
      const res = await fetch('/api/admin/request-access/list', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.error || 'Failed') }
      const data = await res.json()
      setRequests(data.requests || [])
    } catch (e) {
      console.warn('Load requests failed', e)
    } finally { setRefreshing(false) }
  }

  useEffect(() => { if (!loading) load() }, [loading])

  async function decide(id, decision) {
    const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
    try {
      const res = await fetch(`/api/admin/request-access/${id}/decision`, { method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ decision }) })
      if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.error || 'Failed') }
      await load()
    } catch (e) {
      alert('Action failed: ' + (e.message || e))
    }
  }

  if (loading) return <div style={{padding:20}}>Loading…</div>

  return (
    <main style={{padding:20, maxWidth:1000, margin:'0 auto'}}>
      <h2 style={{marginTop:0}}>Temporary Access Requests</h2>
      <div style={{marginBottom:12}}>
        <button className="btn btn-ghost" onClick={()=>router.push('/admin')}>Back to dashboard</button>
        <button className="btn" style={{marginLeft:8}} onClick={load} disabled={refreshing}>{refreshing ? 'Refreshing…' : 'Refresh'}</button>
      </div>

      <div className="card">
        <div style={{display:'grid', gap:8}}>
          {requests.length === 0 ? (
            <div style={{color:'#888', padding:12}}>No requests.</div>
          ) : (
            requests.map(r => (
              <div key={r.id} style={{padding:12, borderBottom:'1px solid rgba(255,255,255,0.04)', display:'flex', justifyContent:'space-between'}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700}}>{r.requesterEmail} - <span style={{fontWeight:400}}>{r.scope}</span></div>
                  <div style={{color:'#bbb', marginTop:6}}>{r.note}</div>
                  <div style={{color:'#999', marginTop:6}}>Requested: {new Date(r.createdAt).toLocaleString()}</div>
                  {r.status !== 'PENDING' && <div style={{color:'#999', marginTop:6}}>Status: {r.status} - Reviewed: {r.reviewedAt ? new Date(r.reviewedAt).toLocaleString() : '—'}</div>}
                </div>
                <div style={{minWidth:160, display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end'}}>
                  {r.status === 'PENDING' ? (
                    <>
                      <button className="btn btn-primary" onClick={()=>decide(r.id, 'APPROVE')}>Approve</button>
                      <button className="btn btn-ghost" onClick={()=>decide(r.id, 'DENY')}>Deny</button>
                    </>
                  ) : (
                    <div style={{color:'#aaa'}}>{r.status}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
