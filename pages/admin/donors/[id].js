import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

function fmtDate(d){
  try{ return new Date(d).toLocaleString() }catch(e){ return d }
}

export default function DonorDetail(){
  const router = useRouter()
  const { id } = router.query
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [donor, setDonor] = useState(null)
  const [donations, setDonations] = useState([])

  useEffect(()=>{
    async function load(){
      if (!id) return
      setLoading(true); setError(null)
      try{
          const token = (()=>{ try{ return localStorage.getItem('token') }catch(e){return null} })()
          const res = await fetch(`/api/donors/${id}`, { headers: { ...(token?{ Authorization:`Bearer ${token}` }:{} ) } })
        if (res.status === 404) { setError('Donor not found'); return }
        if (res.status === 401 || res.status === 403) {
          const j = await res.json().catch(()=>({})); setError(j.error || 'Unauthorized'); return
        }
        if (!res.ok) { const txt = await res.text().catch(()=>('')); setError(txt || 'Failed to load donor'); return }
        const json = await res.json()
        setDonor(json.donor)
        setDonations(json.donations || [])
      }catch(e){ console.warn(e); setError('Network error') }
      finally{ setLoading(false) }
    }
    load()
  },[id])

  if (loading) return <div style={{padding:20}}>Loading…</div>
  if (error) return (
    <div style={{padding:20}}>
      <div style={{display:'flex', gap:12, alignItems:'center'}}>
        <h2 style={{color:'var(--color-neon)'}}>Donor</h2>
        <button className="btn" onClick={()=>router.push('/admin/donors')}>Back</button>
      </div>
      <div style={{marginTop:12, color:'#ff8080'}}>{error}</div>
    </div>
  )

  return (
    <div style={{padding:20}}>
      <div style={{display:'flex', alignItems:'center', gap:12}}>
        <div>
          <h2 style={{color:'var(--color-neon)', margin:0}}>{donor.firstName} {donor.lastName || ''}</h2>
          <div style={{fontSize:13, color:'#bbb'}}>{donor.email || '—'} - Total: ${Number(donor.totalGiving||0).toFixed(2)}</div>
        </div>
        <div style={{marginLeft:'auto', display:'flex', gap:8}}>
          <button className="btn" onClick={()=>router.push('/admin/donors')}>Back</button>
          <button className="btn btn-primary" onClick={()=>router.push('/admin/donors')}>Record Donation</button>
        </div>
      </div>

      <section style={{marginTop:18, maxWidth:1000}}>
        <h3 style={{marginTop:0}}>Notes</h3>
        <div style={{whiteSpace:'pre-wrap', color:'#ddd', background:'rgba(255,255,255,0.02)', padding:12, borderRadius:6}}>{donor.notes || '-'}</div>

        <h3 style={{marginTop:20}}>Donations</h3>
        {donations.length===0 ? (
          <div style={{color:'#bbb'}}>No donations recorded yet.</div>
        ) : (
          <table style={{width:'100%', borderCollapse:'collapse', marginTop:8}}>
            <thead>
              <tr style={{textAlign:'left', color:'#bbb'}}>
                <th style={{padding:8}}>Date</th>
                <th style={{padding:8}}>Amount</th>
                <th style={{padding:8}}>Campaign</th>
                <th style={{padding:8}}>Method</th>
                <th style={{padding:8}}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {donations.map(d=> (
                <tr key={d.id} style={{borderTop:'1px solid rgba(255,255,255,0.03)'}}>
                  <td style={{padding:8}}>{fmtDate(d.date)}</td>
                  <td style={{padding:8}}>${Number(d.amount||0).toFixed(2)}</td>
                  <td style={{padding:8}}>{d.campaignId || '—'}</td>
                  <td style={{padding:8}}>{d.method || '—'}</td>
                  <td style={{padding:8}}>{d.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
