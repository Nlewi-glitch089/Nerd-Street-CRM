import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function AdminUsers() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
        if (!token) { router.replace('/signin'); return }
        const res = await fetch('/api/protected', { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) { router.replace('/signin'); return }
        const data = await res.json()
        if (!data?.user || data.user.role !== 'ADMIN') { router.replace('/signin'); return }
        await loadUsers()
      } catch (e) { console.warn(e); setError('Failed to load users') } finally { if (mounted) setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  async function loadUsers() {
    try {
      const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
      const res = await fetch('/api/users', { headers: { ...(token?{ Authorization:`Bearer ${token}` }:{} ) } })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (e) { console.warn('loadUsers failed', e); setError('Failed to load users') }
  }

  async function toggleActive(u) {
    try {
      const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
      const res = await fetch(`/api/users/${u.id}/deactivate`, { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{} ) }, body: JSON.stringify({ active: !u.active }) })
      if (!res.ok) {
        const d = await res.json().catch(()=>null)
        throw new Error(d?.error || 'Failed')
      }
      await loadUsers()
    } catch (e) { console.warn('toggleActive failed', e); setError(e.message || 'Action failed') }
  }

  if (loading) return <div style={{padding:24}}>Loading…</div>
  return (
    <main style={{padding:20}}>
      <h2 style={{marginTop:0}}>User Management</h2>
      {error && <div style={{color:'#ff8080'}}>{error}</div>}
      <div style={{marginTop:12}}>
        <button className="btn btn-ghost" onClick={()=>router.push('/admin')}>Back</button>
      </div>

      <div style={{marginTop:12, border:'1px solid rgba(255,255,255,0.03)', padding:12, borderRadius:8}}>
        <div style={{fontWeight:700, marginBottom:8}}>Users</div>
        <div style={{display:'flex', flexDirection:'column', gap:8}}>
          {users.length === 0 ? (<div style={{color:'#888'}}>No users</div>) : users.map(u => (
            <div key={u.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:8, borderBottom:'1px solid rgba(255,255,255,0.02)'}}>
              <div>
                <div style={{fontWeight:700}}>{u.name || '(no name)'} {u.email ? <span style={{fontSize:12, color:'#bbb', marginLeft:8}}> - {u.email}</span> : null}</div>
                <div style={{fontSize:12, color:'#bbb'}}>Role: {u.role} - Active: {u.active ? 'Yes' : 'No'} {u.deactivatedAt ? ` - Deactivated: ${new Date(u.deactivatedAt).toLocaleString()}` : ''}</div>
              </div>
              <div>
                <button className="btn" onClick={()=>toggleActive(u)}>{u.active ? 'Deactivate' : 'Reactivate'}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
