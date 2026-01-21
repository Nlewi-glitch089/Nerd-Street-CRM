import { useState } from 'react'
import { useRouter } from 'next/router'

export default function NewDonor(){
  const router = useRouter()
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', phone:'', notes:'', city:'', state:'', zipcode:'', active:true })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  async function handleSubmit(e){
    e.preventDefault()
    if (!form.firstName || !form.email) return setError('First name and email required')
    setLoading(true); setError(null); setSuccessMessage(null)
    try{
      const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
      const res = await fetch('/api/donors', { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{} ) }, body: JSON.stringify(form) })
      // attempt to parse JSON, fallback to raw text so we can show server 500 bodies
      const text = await res.text().catch(()=>(''))
      let data = {}
      try { data = text ? JSON.parse(text) : {} } catch (e) { data = { __raw: text } }
      if (!res.ok) {
        const msg = data?.error || data?.details || data?.__raw || `Failed to create donor (${res.status})`
        setError(msg)
        setLoading(false)
        return
      }
      // success: show a short confirmation so user sees the create succeeded
      const name = (data && data.donor && (data.donor.firstName || data.donor.email)) || ''
      const id = (data && data.donor && data.donor.id) || ''
      setSuccessMessage(id ? `Donor created — adding to database (id: ${id})` : `Donor created — adding to database`)
      const target = `/admin/donors?added=1${name ? `&name=${encodeURIComponent(name)}` : ''}${id ? `&id=${encodeURIComponent(id)}` : ''}`
      try {
        // brief pause so the success message is visible during redirect
        await new Promise(r => setTimeout(r, 800))
        await router.push(target)
      } catch (err) {
        try { window.location.href = target } catch (e) { /* ignore */ }
      }
    }catch(e){ console.warn(e); setError('Network error') } finally { setLoading(false) }
  }
  // Note: keep the page visible while creating; show inline loading on the Create button

  return (
    <div style={{padding:20}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <h2 style={{color:'var(--color-neon)', margin:0}}>Add Donor</h2>
        <div>
          <button className="btn" onClick={()=>router.push('/admin/donors')}>Back</button>
        </div>
      </div>

      <div style={{marginTop:12, maxWidth:900, marginLeft:'auto', marginRight:'auto'}}>
        <form onSubmit={handleSubmit} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <input className="input" placeholder="First name" value={form.firstName} onChange={e=>setForm({...form, firstName: e.target.value})} />
          <input className="input" placeholder="Last name" value={form.lastName} onChange={e=>setForm({...form, lastName: e.target.value})} />

          <input className="input" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} />
          <input className="input" placeholder="Phone" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} />

          <input className="input" placeholder="City" value={form.city} onChange={e=>setForm({...form, city: e.target.value})} />
          <input className="input" placeholder="State" value={form.state} onChange={e=>setForm({...form, state: e.target.value})} />

          <input className="input" placeholder="Zipcode" value={form.zipcode} onChange={e=>setForm({...form, zipcode: e.target.value})} />
          <div style={{display:'flex', alignItems:'center', gap:8, paddingLeft:6}}>
            <input id="active" type="checkbox" checked={form.active} onChange={e=>setForm({...form, active: e.target.checked})} />
            <label htmlFor="active" style={{fontSize:13, color:'#bbb'}}>Active donor</label>
          </div>

          <div style={{gridColumn:'1/-1'}}>
            <textarea className="input" placeholder="Notes" value={form.notes} onChange={e=>setForm({...form, notes: e.target.value})} style={{minHeight:120}} />
          </div>

          <div style={{gridColumn:'1/-1', display:'flex', justifyContent:'flex-end'}}>
            <button className="btn btn-ghost" onClick={()=>router.push('/admin/donors')} type="button">Cancel</button>
            <button className="btn btn-primary" disabled={loading} style={{marginLeft:8}}>{loading? 'Creating...':'Create Donor'}</button>
          </div>
          {error && (
            <div style={{gridColumn:'1/-1', color:'#ff8080', fontWeight:700}}>{error}</div>
          )}
          {successMessage && !loading && (
            <div style={{gridColumn:'1/-1', color:'var(--color-neon)', fontWeight:700}}>{successMessage}</div>
          )}
        </form>
      </div>
    </div>
  )
}
