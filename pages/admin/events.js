import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function AdminEvents(){
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [events, setEvents] = useState([])
  const [editingEvent, setEditingEvent] = useState(null)

  useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      try{
        const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
        if (!token) { setError('Not authenticated'); setLoading(false); return }
        await loadEvents()
      }catch(err){ console.warn(err); setError('Network error') } finally { if (mounted) setLoading(false) }
    })()
    return ()=>{ mounted=false }
  },[])

  async function loadEvents(){
    try{
      const res = await fetch('/api/events')
      if (!res.ok) return
      const data = await res.json()
      setEvents(data.events || [])
    }catch(e){ console.warn(e) }
  }

  return (
    <div style={{padding:20}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2 style={{color:'var(--color-neon)'}}>Events</h2>
        <div>
          <button className="btn" onClick={()=>router.push('/admin')}>Back</button>
        </div>
      </div>

      <div style={{marginTop:12}}>
        <div style={{marginBottom:12}}>
          <button className="btn btn-primary" onClick={()=>setEditingEvent({ title:'', description:'', startAt:'', endAt:'', location:'' })}>Create Event</button>
        </div>
        {events.length===0 ? (<div style={{color:'#888'}}>No events found.</div>) : (
          <div style={{display:'flex', flexDirection:'column', gap:12}}>
            {events.map(e => (
              <div key={e.id} style={{padding:12, border:'1px solid rgba(255,255,255,0.03)', borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:700}}>{e.title}</div>
                  <div style={{fontSize:12, color:'#bbb'}}>{e.description || ''}</div>
                  <div style={{fontSize:12, color:'#bbb'}}>When: {e.startAt ? new Date(e.startAt).toLocaleString() : '-'}</div>
                </div>
                <div style={{display:'flex', gap:8}}>
                  <button className="btn" onClick={()=>setEditingEvent({...e})}>Edit</button>
                  <button className="btn btn-danger" onClick={async ()=>{
                    if (!confirm('Delete this event?')) return
                    try {
                      const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
                      const res = await fetch(`/api/events/${e.id}`, { method: 'DELETE', headers: { ...(token?{ Authorization:`Bearer ${token}` }:{} ) } })
                      if (!res.ok) { const err = await res.json().catch(()=>({})); return alert('Delete failed: '+(err.error||res.status)) }
                      await loadEvents()
                    } catch (err) { console.warn(err); alert('Delete failed') }
                  }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingEvent && (
        <div className="dialog-backdrop">
          <div style={{width:640, background:'var(--color-off-black)', border:'1px solid rgba(255,255,255,0.04)', padding:18, borderRadius:8}}>
            <h3 style={{color:'var(--color-neon)'}}>{editingEvent.id ? 'Edit Event' : 'Create Event'}</h3>
            <form onSubmit={async (e)=>{
              e.preventDefault()
              try {
                const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
                const payload = { title: editingEvent.title, description: editingEvent.description, startAt: editingEvent.startAt || null, endAt: editingEvent.endAt || null, location: editingEvent.location }
                if (editingEvent.id) {
                  const res = await fetch(`/api/events/${editingEvent.id}`, { method: 'PUT', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{} ) }, body: JSON.stringify(payload) })
                  if (!res.ok) { const err = await res.json().catch(()=>({})); return alert('Update failed: '+(err.error||res.status)) }
                } else {
                  const res = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{} ) }, body: JSON.stringify(payload) })
                  if (!res.ok) { const err = await res.json().catch(()=>({})); return alert('Create failed: '+(err.error||res.status)) }
                }
                setEditingEvent(null)
                await loadEvents()
              } catch (err) { console.warn(err); alert('Save failed') }
            }} style={{display:'flex', flexDirection:'column', gap:12}}>
              <label style={{fontSize:12, color:'#bbb'}}>Title</label>
              <input className="input" value={editingEvent.title} onChange={e=>setEditingEvent({...editingEvent, title: e.target.value})} />
              <label style={{fontSize:12, color:'#bbb'}}>Description</label>
              <textarea className="input" value={editingEvent.description || ''} onChange={e=>setEditingEvent({...editingEvent, description: e.target.value})} />
              <label style={{fontSize:12, color:'#bbb'}}>Start</label>
              <input className="input" type="datetime-local" value={editingEvent.startAt ? new Date(editingEvent.startAt).toISOString().slice(0,16) : ''} onChange={e=>setEditingEvent({...editingEvent, startAt: e.target.value ? new Date(e.target.value).toISOString() : ''})} />
              <label style={{fontSize:12, color:'#bbb'}}>End</label>
              <input className="input" type="datetime-local" value={editingEvent.endAt ? new Date(editingEvent.endAt).toISOString().slice(0,16) : ''} onChange={e=>setEditingEvent({...editingEvent, endAt: e.target.value ? new Date(e.target.value).toISOString() : ''})} />
              <label style={{fontSize:12, color:'#bbb'}}>Location</label>
              <input className="input" value={editingEvent.location || ''} onChange={e=>setEditingEvent({...editingEvent, location: e.target.value})} />
              <div style={{display:'flex', gap:8}}>
                <button className="btn" type="submit">Save</button>
                <button className="btn btn-ghost" type="button" onClick={()=>setEditingEvent(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
