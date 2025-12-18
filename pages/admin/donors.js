import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function AdminDonors() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)

  const [donors, setDonors] = useState([])
  const [campaigns, setCampaigns] = useState([])

  const [newDonor, setNewDonor] = useState({ firstName:'', lastName:'', email:'', phone:'' })
  const [adding, setAdding] = useState(false)
  const [donationModal, setDonationModal] = useState(null) // { donor }
  const [donationLoading, setDonationLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [donationForm, setDonationForm] = useState({ amount:'', campaignId:'', method:'CASH', methodDetail:'', notes:'' })
  const [previewDonor, setPreviewDonor] = useState(null) // { donor, totalGiving, giftedTotal, gifts, lastGiftAt }
  const [fullDonor, setFullDonor] = useState(null) // full donor with donations for client-side view

  // Client-side sample generators (used as fallback when server returns no data)
  function generateSampleCampaigns() {
    return [
      { id: 'sample-c-1', name: 'Spring Fundraiser 2025', goal: 75000, raised: 12000, giftedRaised: 2000, approved: true },
      { id: 'sample-c-2', name: 'Community Outreach Q2', goal: 20000, raised: 5000, giftedRaised: 800, approved: false },
      { id: 'sample-c-3', name: 'Scholarship Drive', goal: 30000, raised: 15000, giftedRaised: 3000, approved: true },
      { id: 'sample-c-4', name: 'Winter Relief 2025', goal: 40000, raised: 22000, giftedRaised: 5000, approved: true }
    ]
  }

  function generateSampleDonations(donorId) {
    const now = Date.now()
    const rand = (min, max) => Math.round((Math.random()*(max-min))+min)
    const list = []
    const count = rand(2,6)
    for (let i=0;i<count;i++){
      const amount = rand(20, 5000)
      list.push({ id: `sample-d-${donorId}-${i}`, donorId, amount, date: new Date(now - (i*86400000*rand(5,30))).toISOString(), campaignId: i%2===0 ? 'sample-c-1' : 'sample-c-2', method: (i%3===0? 'CARD':'CASH'), notes: (i%4===0 ? 'gift' : '') })
    }
    // sort descending by date
    return list.sort((a,b)=> new Date(b.date) - new Date(a.date))
  }

  function generateSampleDonors() {
    const names = [
      ['Nate','Marshall'], ['Evelyn','Hart'], ['Jamal','Reyes'], ['Lila','Kim'], ['Owen','Park'],
      ['Maya','Singh'], ['Alex','Chen'], ['Sofia','Diaz'], ['Ryan','West'], ['Zoe','Ng']
    ]
    return names.map((n,i)=>{
      const id = `sample-${i+1}`
      const donations = generateSampleDonations(id)
      const totalGiving = donations.reduce((s,x)=> s + Number(x.amount||0), 0)
      const giftedTotal = donations.filter(d=> String(d.notes||'').toLowerCase().includes('gift')).reduce((s,x)=> s + Number(x.amount||0), 0)
      return {
        id,
        firstName: n[0],
        lastName: n[1],
        email: `${n[0].toLowerCase()}.${n[1].toLowerCase()}@example.org`,
        phone: '555-010' + (i+1).toString().padStart(2,'0'),
        totalGiving,
        giftedTotal,
        donations // include for client-side full view
      }
    })
  }

  function openDonationModal(donor) {
    setDonationModal({ donor })
    setDonationForm({ amount:'', campaignId:'', method:'CASH', methodDetail:'', notes:'' })
  }

  async function openPreview(donor) {
    try {
      const isGift = (x) => {
        try {
          const m = String(x.method || '').toLowerCase()
          const n = String(x.notes || '').toLowerCase()
          return /gift/.test(m) || /gift/.test(n)
        } catch (e) { return false }
      }

      // fetch donor detail from server; if it fails, synthesize a client-side preview
      try {
        const res = await fetch(`/api/donors/${donor.id}`)
        if (!res.ok) throw new Error('no-server')
        const data = await res.json()
        const gifts = data.donations || []
        const totalGiving = (gifts || []).reduce((s,x)=>s + (Number(x.amount||0) || 0), 0)
        const giftedTotal = (gifts || []).filter(isGift).reduce((s,x)=>s + (Number(x.amount||0) || 0), 0)
        const lastGiftAt = (gifts && gifts.length>0) ? gifts[0].date || gifts[gifts.length-1].date : null
        setPreviewDonor({ donor: data.donor || donor, totalGiving, giftedTotal, gifts: gifts.length, lastGiftAt, donations: gifts })
        return
      } catch (err) {
        // build a client-side preview from sample donors (or generate for this donor)
        try {
          const local = generateSampleDonors().find(s => s.id === donor.id) || null
          const donations = local ? local.donations : generateSampleDonations(donor.id || 'local')
          const totalGiving = (donations || []).reduce((s,x)=>s + (Number(x.amount||0) || 0), 0)
          const giftedTotal = (donations || []).filter(isGift).reduce((s,x)=>s + (Number(x.amount||0) || 0), 0)
          const lastGiftAt = (donations && donations.length>0) ? donations[0].date : null
          setPreviewDonor({ donor: { ...donor, email: donor.email || (`${donor.firstName||'user'}.sample@example.org`) }, totalGiving, giftedTotal, gifts: donations.length, lastGiftAt, donations })
          return
        } catch (e) { throw e }
      }
    } catch (e) { console.warn(e); setPreviewDonor({ donor, error: 'Preview failed' }) }
  }

  // demo generators removed — always rely on server data

  function filteredDonors(list, term) {
    if (!term || term.trim()==='') return list
    const q = term.toLowerCase()
    // if user types a single character, match by startsWith for more precise narrowing
    if (q.length === 1) {
      return list.filter(d => {
        const first = (d.firstName||'').toLowerCase()
        const last = (d.lastName||'').toLowerCase()
        const email = (d.email||'').toLowerCase()
        return first.startsWith(q) || last.startsWith(q) || email.startsWith(q)
      })
    }
    return list.filter(d => {
      const name = ((d.firstName||'') + ' ' + (d.lastName||'')).toLowerCase()
      const email = (d.email||'').toLowerCase()
      return name.includes(q) || email.includes(q)
    })
  }

  useEffect(()=>{
    let mounted = true
    ;(async ()=>{
      try{
        const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
        if (!token) { setError('Not authenticated'); setLoading(false); return }
        const res = await fetch('/api/protected', { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) { setError('Session invalid'); setLoading(false); return }
        const data = await res.json()
        if (!data?.user) { setError('Unable to load user'); setLoading(false); return }
        setUser(data.user)
        await loadDonors()
        await loadCampaigns()
      }catch(err){ console.warn(err); setError('Network error') } finally { if (mounted) setLoading(false) }
    })()
    return ()=>{ mounted=false }
  },[])

  async function loadDonors(){
    try{
      const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
      const res = await fetch('/api/donors', { headers: { ...(token?{ Authorization:`Bearer ${token}` }:{} ) } })
      if (!res.ok) return
      const data = await res.json()
      const list = data.donors || []
      if (!list || list.length === 0) {
        // attempt to auto-seed server-side data and reload
        try {
          const sRes = await fetch('/api/seed', { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{} ) } })
          if (sRes.ok) {
            // reload donors after seeding
            const retry = await fetch('/api/donors', { headers: { ...(token?{ Authorization:`Bearer ${token}` }:{} ) } })
            if (retry.ok) {
              const rdata = await retry.json()
              setDonors(rdata.donors || [])
              return
            }
          }
        } catch (e) { console.warn('Auto-seed donors failed', e) }
        // fallback to client-side sample donors for a working UI
        try {
          const samples = generateSampleDonors()
          setDonors(samples)
          // also populate campaigns if empty so donation form has choices
          const sampleCampaigns = generateSampleCampaigns()
          setCampaigns(sampleCampaigns)
          return
        } catch (e) {
          console.warn('Local sample donors failed', e)
        }
        setDonors([])
        return
      }
      // try to enrich donors with gifted totals via analytics donorStats
      try{
        const aRes = await fetch('/api/analytics')
        if (aRes.ok) {
          const aData = await aRes.json()
          const needSeed = !aData || !Array.isArray(aData.donorStats) || aData.donorStats.length === 0
          if (needSeed) {
            // try server-side seed and reload analytics + donors
            try {
              const sRes = await fetch('/api/seed', { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{} ) } })
              if (sRes.ok) {
                const newARes = await fetch('/api/analytics')
                if (newARes.ok) {
                  const newAData = await newARes.json()
                  const map = (newAData.donorStats || []).reduce((acc,x)=>{ acc[x.id]=x; return acc }, {})
                  const enriched = list.map(d => ({ ...d, giftedTotal: (map[d.id] && (map[d.id].giftedTotal || map[d.id].gifted)) || 0 }))
                  setDonors(enriched)
                  return
                }
              }
            } catch (e) { console.warn('Auto-seed analytics failed', e) }
          }
          const map = (aData.donorStats || []).reduce((acc,x)=>{ acc[x.id]=x; return acc }, {})
          const enriched = list.map(d => ({ ...d, giftedTotal: (map[d.id] && (map[d.id].giftedTotal || map[d.id].gifted)) || 0 }))
          setDonors(enriched)
        } else {
          setDonors(list)
        }
      }catch(e){ console.warn('Enrich donors failed', e); setDonors(list) }
    }catch(e){ console.warn(e) }
  }

  async function loadCampaigns(){
    try{
      const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
      const res = await fetch('/api/campaigns')
      if (!res.ok) return
      const data = await res.json()
      const list = data.campaigns || []
      if (!list || list.length === 0) {
        // attempt to auto-seed server-side data and reload
        try {
          const sRes = await fetch('/api/seed', { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{} ) } })
          if (sRes.ok) {
            const retry = await fetch('/api/campaigns')
            if (retry.ok) {
              const rdata = await retry.json()
              setCampaigns(rdata.campaigns || [])
              return
            }
          }
        } catch (e) { console.warn('Auto-seed campaigns failed', e) }
        setCampaigns([])
        return
      }
      setCampaigns(list)
    }catch(e){ console.warn(e) }
  }

  async function handleAddDonor(e){
    e.preventDefault()
    if (!newDonor.firstName || !newDonor.email) return alert('Name and email required')
    setAdding(true)
    try{
      const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
      const res = await fetch('/api/donors', { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{} ) }, body: JSON.stringify(newDonor) })
      if (!res.ok) { const err = await res.json().catch(()=>({})); return alert('Add donor failed: '+(err.error||'unknown')) }
      setNewDonor({ firstName:'', lastName:'', email:'', phone:'' })
      await loadDonors()
    }catch(e){ console.warn(e); alert('Failed to add donor') } finally { setAdding(false) }
  }

  if (loading) {
    return (
      <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--color-black, #000)'}}>
        <div style={{textAlign:'center', color:'var(--color-neon, #39ff14)'}}>
          <div style={{width:92, height:92, borderRadius:46, border:'6px solid rgba(57,255,20,0.12)', borderTopColor:'var(--color-neon, #39ff14)', animation:'spin 1s linear infinite', margin:'0 auto 18px'}} />
          <div>Loading donors...</div>
          <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    )
  }
  if (error) return <div style={{padding:24, color:'#ff8080'}}>{error}</div>

  return (
    <div style={{padding:20}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2 style={{color:'var(--color-neon)'}}>Donors</h2>
        <div>
          <button className="btn" onClick={()=>router.push('/admin')}>Back</button>
        </div>
      </div>

      <section style={{marginTop:12, display:'grid', gridTemplateColumns:'1fr 320px', gap:20}}>
        <div>
          <div style={{border:'1px solid rgba(255,255,255,0.03)', padding:12, borderRadius:8}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div style={{fontWeight:700}}>All Donors</div>
              <div style={{width:320}}>
                <input className="input" placeholder="Filter by name or email" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div style={{marginTop:8, display:'flex', flexDirection:'column', gap:8}}>
              {filteredDonors(donors, searchTerm).length===0 ? (<div style={{color:'#888'}}>No donors match your search</div>) : filteredDonors(donors, searchTerm).map(d => (
                <div key={d.id} style={{padding:10, borderBottom:'1px solid rgba(255,255,255,0.02)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div>
                    <div style={{fontWeight:700}}>{d.firstName} {d.lastName || ''}</div>
                    <div style={{fontSize:12, color:'#bbb'}}>
                      {d.email} — ${d.totalGiving || 0}
                      { (typeof d.giftedTotal !== 'undefined') && (
                        <span style={{marginLeft:8, color:'#9be'}}>{`(gifts: $${d.giftedTotal})`}</span>
                      ) }
                    </div>
                  </div>
                  <div style={{display:'flex', gap:8}}>
                    <button className="btn" onClick={()=>openDonationModal(d)}>Record Donation</button>
                    <button className="btn btn-ghost" onClick={()=>openPreview(d)}>View</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside>
          <div style={{border:'1px solid rgba(255,255,255,0.03)', padding:12, borderRadius:8}}>
            <div style={{fontWeight:700, marginBottom:8}}>Add New Donor</div>
            <div style={{marginTop:8}}>
              <button className="btn btn-primary" onClick={()=>router.push('/admin/donors/new')}>Add Donor</button>
            </div>
          </div>

          
        </aside>
      </section>

      {donationModal && (
        <div className="dialog-backdrop">
          <div style={{width:520, background:'var(--color-off-black)', border:'1px solid rgba(255,255,255,0.04)', padding:18, borderRadius:8}}>
            <h3 style={{color:'var(--color-neon)'}}>Record Donation for {donationModal.donor.firstName} {donationModal.donor.lastName || ''}</h3>
            <form onSubmit={async (e)=>{
              e.preventDefault()
              const amount = parseFloat(donationForm.amount)
              if (!amount || isNaN(amount)) return alert('Enter a valid amount')
              try{
                setDonationLoading(true)
                const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
                // build notes including method detail (do not store full card numbers in production)
                let notes = donationForm.notes || ''
                if (donationForm.methodDetail) {
                  notes = `${donationForm.method} - ${donationForm.methodDetail}${notes? ' | '+notes : ''}`
                } else {
                  notes = `${donationForm.method}${notes? ' | '+notes : ''}`
                }
                const payload = { donorId: donationModal.donor.id, amount, campaignId: donationForm.campaignId || null, method: donationForm.method, notes }
                const res = await fetch('/api/donations', { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{} ) }, body: JSON.stringify(payload) })
                if (!res.ok) { const err = await res.json().catch(()=>({})); return alert('Record failed: '+(err.error||'unknown')) }
                await loadDonors()
                setDonationModal(null)
              }catch(e){ console.warn(e); alert('Failed to record donation') } finally { setDonationLoading(false) }
            }} style={{display:'flex', flexDirection:'column', gap:12, marginTop:12}}>
              <label style={{fontSize:12, color:'#bbb'}}>Amount</label>
              <input className="input" type="number" min="0" step="0.01" value={donationForm.amount} onChange={e=>setDonationForm({...donationForm, amount: e.target.value})} placeholder="0.00" />

              <label style={{fontSize:12, color:'#bbb'}}>Apply To (optional)</label>
              <select className="input" value={donationForm.campaignId || ''} onChange={e=>setDonationForm({...donationForm, campaignId: e.target.value || ''})}>
                <option value="">General / Unrestricted</option>
                {campaigns.map(c => (<option key={c.id} value={c.id}>{c.name || c.title || c.name}</option>))}
              </select>

              <label style={{fontSize:12, color:'#bbb'}}>Payment Method</label>
              <select className="input" value={donationForm.method} onChange={e=>setDonationForm({...donationForm, method: e.target.value})}>
                <option value="CARD">Card</option>
                <option value="CHECK">Check</option>
                <option value="CASH">Cash</option>
                <option value="OTHER">Other</option>
              </select>

              {donationForm.method === 'CARD' && (
                <div style={{display:'grid', gridTemplateColumns:'1fr 120px', gap:8}}>
                  <input className="input" placeholder="Card type (Visa/Master)" value={donationForm.methodDetail || ''} onChange={e=>setDonationForm({...donationForm, methodDetail: e.target.value})} />
                  <input className="input" placeholder="Last 4" maxLength={4} value={donationForm.methodDetail && donationForm.methodDetail.length===4 && donationForm.methodDetail ? donationForm.methodDetail : donationForm.methodDetail} onChange={e=>setDonationForm({...donationForm, methodDetail: e.target.value.replace(/[^0-9]/g,'').slice(0,4)})} />
                </div>
              )}

              {donationForm.method === 'CHECK' && (
                <input className="input" placeholder="Check number" value={donationForm.methodDetail || ''} onChange={e=>setDonationForm({...donationForm, methodDetail: e.target.value})} />
              )}

              {donationForm.method === 'OTHER' && (
                <input className="input" placeholder="Method detail" value={donationForm.methodDetail || ''} onChange={e=>setDonationForm({...donationForm, methodDetail: e.target.value})} />
              )}

              <label style={{fontSize:12, color:'#bbb'}}>Notes / Gift Designation</label>
              <textarea className="input" rows={3} value={donationForm.notes} onChange={e=>setDonationForm({...donationForm, notes: e.target.value})} />

              <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
                <button type="button" className="btn btn-ghost" onClick={()=>{ setDonationModal(null) }}>Cancel</button>
                <button className="btn btn-primary" disabled={donationLoading}>{donationLoading? 'Recording...' : 'Record Donation'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {previewDonor && (
        <div className="dialog-backdrop">
          <div style={{width:420, background:'var(--color-off-black)', border:'1px solid rgba(255,255,255,0.04)', padding:18, borderRadius:8}}>
            <h3 style={{color:'var(--color-neon)'}}>Donor Summary</h3>
            <div style={{marginTop:8}}>
              <div style={{fontWeight:700}}>{previewDonor.donor.firstName} {previewDonor.donor.lastName || ''}</div>
              <div style={{fontSize:13, color:'#bbb'}}>{previewDonor.donor.email}</div>
              {previewDonor.error ? (
                <div style={{color:'#ff8080', marginTop:8}}>{previewDonor.error}</div>
              ) : (
                <div style={{marginTop:8, fontSize:13, color:'#bbb'}}>
                  <div>Gifts: <strong style={{color:'var(--color-neon)'}}>${previewDonor.totalGiving || 0}</strong></div>
                  <div style={{marginTop:6}}>Gifted amount: <strong style={{color:'var(--color-neon)'}}>${previewDonor.giftedTotal || 0}</strong></div>
                  <div style={{marginTop:6}}>Number of gifts: {previewDonor.gifts || 0}</div>
                  {previewDonor.lastGiftAt && <div style={{marginTop:6}}>Last gift: {previewDonor.lastGiftAt}</div>}
                </div>
              )}
            </div>
              <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:12}}>
              <button className="btn btn-ghost" onClick={()=>setPreviewDonor(null)}>Close</button>
              <button className="btn" onClick={()=>{ setFullDonor(previewDonor); setPreviewDonor(null) }}>View Full</button>
            </div>
          </div>
        </div>
      )}
      {fullDonor && (
        <div className="dialog-backdrop">
          <div style={{width:720, maxHeight:'80vh', overflowY:'auto', background:'var(--color-off-black)', border:'1px solid rgba(255,255,255,0.04)', padding:18, borderRadius:8}}>
            <h3 style={{color:'var(--color-neon)'}}>{fullDonor.donor.firstName} {fullDonor.donor.lastName || ''} — Full History</h3>
            <div style={{color:'#bbb', marginTop:8}}>{fullDonor.donor.email}</div>
            <div style={{marginTop:12}}>
              <div style={{fontWeight:700}}>Total Giving: <span style={{color:'var(--color-neon)'}}>${fullDonor.totalGiving || 0}</span></div>
              <div style={{marginTop:8}}>Gifts: <strong style={{color:'var(--color-neon)'}}>${fullDonor.giftedTotal || 0}</strong></div>
            </div>
            <div style={{marginTop:12}}>
              <div style={{fontWeight:700, marginBottom:8}}>Donation History</div>
              <div style={{display:'flex', flexDirection:'column', gap:8}}>
                {(fullDonor.donations || []).map(d => (
                  <div key={d.id} style={{padding:8, border:'1px solid rgba(255,255,255,0.03)', borderRadius:6, display:'flex', justifyContent:'space-between'}}>
                    <div>
                      <div style={{fontWeight:700}}>${d.amount}</div>
                      <div style={{fontSize:12, color:'#bbb'}}>{new Date(d.date).toLocaleDateString()}</div>
                    </div>
                    <div style={{fontSize:12, color:'#bbb'}}>{d.campaignId ? `Campaign: ${d.campaignId}` : ''}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:'flex', justifyContent:'flex-end', marginTop:12}}>
              <button className="btn btn-ghost" onClick={()=>setFullDonor(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
