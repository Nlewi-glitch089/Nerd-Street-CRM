import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function AdminDonors() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)

  const [donors, setDonors] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalDonors, setTotalDonors] = useState(0)
  const [editingDonor, setEditingDonor] = useState(null)
  const [donorEditErrors, setDonorEditErrors] = useState(null)
  const [campaigns, setCampaigns] = useState([])

  const [newDonor, setNewDonor] = useState({ firstName:'', lastName:'', email:'', phone:'', initialAmount:'', initialCampaignId:'', initialMethod:'CASH', initialNotes:'' })
  const [adding, setAdding] = useState(false)
  const [donationModal, setDonationModal] = useState(null) // { donor }
  const [donationLoading, setDonationLoading] = useState(false)
  const [deleteModal, setDeleteModal] = useState(null) // donor to delete
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [donationForm, setDonationForm] = useState({ amount:'', campaignId:'', method:'CASH', methodDetail:'', notes:'' })
  const [previewDonor, setPreviewDonor] = useState(null) // { donor, totalGiving, giftedTotal, gifts, lastGiftAt }
  const [fullDonor, setFullDonor] = useState(null) // full donor with donations for client-side view
  const [flashMessage, setFlashMessage] = useState(null)

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
        const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
        const res = await fetch(`/api/donors/${donor.id}`, { headers: { ...(token?{ Authorization:`Bearer ${token}` }:{} ) } })
        if (!res.ok) {
          // if unauthorized or forbidden, surface the permission issue instead of showing fake data
          if (res.status === 401 || res.status === 403) {
            const errBody = await res.json().catch(()=>({ error: 'Unauthorized' }))
            setPreviewDonor({ donor, error: errBody?.error || 'Unauthorized' })
            return
          }
          throw new Error('no-server')
        }
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

  // demo generators removed - always rely on server data

  function filteredDonors(list, term) {
    if (!term || term.trim() === '') return list
    const q = term.toLowerCase()
    // Ranking: prefer starts-with on first/last/email, then full name starts-with, then contains matches.
    // For single-character queries, only return starts-with matches to avoid broad contains matches (e.g., 'y' matching 'Evelyn').
    const scored = list.map(d => {
      const first = (d.firstName || '').toString().toLowerCase()
      const last = (d.lastName || '').toString().toLowerCase()
      const name = ((d.firstName || '') + ' ' + (d.lastName || '')).trim().toLowerCase()
      const email = (d.email || '').toString().toLowerCase()
      let score = 9999
      if (q.length === 1) {
        if (first.startsWith(q) || last.startsWith(q) || email.startsWith(q)) score = 0
      } else {
        if (first.startsWith(q)) score = 0
        else if (last.startsWith(q)) score = 1
        else if (email.startsWith(q)) score = 2
        else if (name.startsWith(q)) score = 3
        else if (first.includes(q) || last.includes(q) || name.includes(q) || email.includes(q)) score = 4
      }
      return { donor: d, score }
    }).filter(x => x.score < 9000).sort((a, b) => a.score - b.score).map(x => x.donor)

    return scored
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
          // show success toast if navigated here after creating a donor
          try {
            const params = (typeof window !== 'undefined') ? new URLSearchParams(window.location.search) : null
            const added = params ? params.get('added') : null
            const addedName = params ? params.get('name') : null
            const addedId = params ? params.get('id') : null
            if (added) {
              const label = addedName ? `Created donor: ${addedName}` : 'Donor created'
              const withId = addedId ? `${label} (id: ${addedId})` : label
              setFlashMessage(withId)
              // auto-open the created donor preview when redirected after create
              try { if (addedId) { openPreview({ id: addedId, firstName: addedName || '' }) } } catch(e){}
              // remove the query from the URL without reloading
              try { const u = new URL(window.location.href); u.searchParams.delete('added'); u.searchParams.delete('name'); u.searchParams.delete('id'); window.history.replaceState({}, '', u.toString()) } catch(e){}
              setTimeout(()=>setFlashMessage(null), 7000)
            }
          } catch(e){}
        await loadDonors(page)
        await loadCampaigns()
      }catch(err){ console.warn(err); setError('Network error') } finally { if (mounted) setLoading(false) }
    })()
    return ()=>{ mounted=false }
  },[])

  // debounce server-side search: when searchTerm changes, query the API after a short delay
  useEffect(() => {
    let mounted = true
    if (!searchTerm || searchTerm.trim() === '') {
      // if cleared, reload full list
      (async () => { try { setPage(1); await loadDonors(1) } catch (e){} })()
      return () => { mounted = false }
    }
    const handle = setTimeout(async () => {
      try {
        setSearchLoading(true)
        const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
        const res = await fetch('/api/donors?q=' + encodeURIComponent(searchTerm) + '&page=1&pageSize=' + encodeURIComponent(pageSize), { headers: { ...(token?{ Authorization:`Bearer ${token}` }:{} ) } })
        if (!res.ok) {
          console.warn('Search /api/donors failed', res.status)
          return
        }
        const data = await res.json()
        if (!mounted) return
        setDonors(Array.isArray(data?.donors) ? data.donors : [])
        setPage(data?.page || 1)
        setPageSize(data?.pageSize || pageSize)
        setTotalDonors(typeof data?.total === 'number' ? data.total : (Array.isArray(data?.donors) ? data.donors.length : 0))
      } catch (e) { console.warn('Search failed', e) }
      finally { if (mounted) setSearchLoading(false) }
    }, 300)
    return () => { mounted = false; clearTimeout(handle) }
  }, [searchTerm, pageSize])

  async function loadDonors(pageArg, pageSizeArg){
    try{
      const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
      const usePage = (typeof pageArg === 'number' && pageArg >= 1) ? pageArg : page
      const usePageSize = (typeof pageSizeArg === 'number' && pageSizeArg > 0) ? pageSizeArg : pageSize
      const res = await fetch('/api/donors?page=' + encodeURIComponent(usePage) + '&pageSize=' + encodeURIComponent(usePageSize), { headers: { ...(token?{ Authorization:`Bearer ${token}` }:{} ) } })
      if (!res.ok) return
      const data = await res.json()
      const list = data.donors || []
      setPage(data?.page || usePage)
      setPageSize(data?.pageSize || usePageSize)
      setTotalDonors(typeof data?.total === 'number' ? data.total : (Array.isArray(list) ? list.length : 0))
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
      const payload = { ...newDonor }
      // normalize optional donation fields for API
      if (!payload.initialAmount) {
        delete payload.initialAmount
        delete payload.initialCampaignId
        delete payload.initialMethod
        delete payload.initialNotes
      }
      const res = await fetch('/api/donors', { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{} ) }, body: JSON.stringify(payload) })
      const text = await res.text().catch(()=>(''))
      let data = {}
      try { data = text ? JSON.parse(text) : {} } catch (e) { data = { __raw: text } }
      if (!res.ok) {
        const message = data?.error || data?.details || data?.__raw || `Add donor failed (${res.status})`
        setFlashMessage(message)
        setTimeout(()=>setFlashMessage(null), 7000)
        return
      }
      // success: show friendly confirmation including the created id and auto-open detail
      const createdId = (data && data.donor && data.donor.id) || ''
      const createdFirst = (data && data.donor && data.donor.firstName) || ''
      const createdEmail = (data && data.donor && data.donor.email) || ''
      const label = createdFirst || createdEmail ? `${createdFirst || createdEmail}` : 'Donor'
      setFlashMessage(createdId ? `Created donor: ${label} (id: ${createdId})` : `Created donor: ${label}`)
      setTimeout(()=>setFlashMessage(null), 7000)
      setNewDonor({ firstName:'', lastName:'', email:'', phone:'', initialAmount:'', initialCampaignId:'', initialMethod:'CASH', initialNotes:'' })
      setPage(1)
      await loadDonors(1, pageSize)
      try { if (createdId) await openPreview({ id: createdId, firstName: createdFirst || createdEmail }) } catch(e) { console.warn('Auto-open preview failed', e) }
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
      {flashMessage && (
        <div style={{marginBottom:12, padding:12, borderRadius:6, background:'rgba(57,255,20,0.06)', color:'var(--color-neon)', fontWeight:700}}>{flashMessage}</div>
      )}
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
              <div style={{width:320, display:'flex', alignItems:'center', gap:8}}>
                <input className="input" placeholder="Filter by name or email" value={searchTerm} onChange={e=>{ setSearchTerm(e.target.value); setPage(1); }} />
                {searchLoading && <div style={{fontSize:12, color:'#9ea', marginLeft:6}}>Searching...</div>}
              </div>
            </div>
            <div style={{marginTop:8, display:'flex', flexDirection:'column', gap:8}}>
              {filteredDonors(donors, searchTerm).length===0 ? (<div style={{color:'#888'}}>No donors match your search</div>) : filteredDonors(donors, searchTerm).map(d => (
                <div key={d.id} style={{padding:10, borderBottom:'1px solid rgba(255,255,255,0.02)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div>
                    <div style={{fontWeight:700}}>{d.firstName} {d.lastName || ''}</div>
                    <div style={{fontSize:12, color:'#bbb'}}>
                      {d.email} - ${d.totalGiving || 0}
                      { (typeof d.giftedTotal !== 'undefined') && (
                        <span style={{marginLeft:8, color:'#9be'}}>{`(gifts: $${d.giftedTotal})`}</span>
                      ) }
                      {/* days-since-last-donation removed per request */}
                    </div>
                  </div>
                  <div style={{display:'flex', gap:8}}>
                    <button className="btn" onClick={()=>openDonationModal(d)}>Record Donation</button>
                    <button className="btn btn-ghost" onClick={()=>openPreview(d)}>View</button>
                    <button className="btn" onClick={()=>{ setEditingDonor({ ...d }) }}>Edit</button>
                    <button className="btn btn-danger" onClick={()=>{ setDeleteModal(d); setDeletePassword(''); setDeleteError(null) }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10}}>
              <div style={{fontSize:13, color:'#bbb'}}>
                {totalDonors ? (()=>{
                  const start = Math.min((page-1)*pageSize + 1, totalDonors)
                  const end = Math.min((page-1)*pageSize + (donors ? donors.length : 0), totalDonors)
                  return `Showing ${start}-${end} of ${totalDonors}`
                })() : 'Showing results'}
              </div>
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                {searchLoading && <div style={{fontSize:12, color:'#9ea'}}>Searching...</div>}
                <button className="btn btn-ghost" disabled={page <= 1} onClick={async ()=>{ const np = Math.max(1, page-1); setPage(np); await loadDonors(np) }}>Prev</button>
                <button className="btn btn-ghost" disabled={((page*pageSize) >= totalDonors)} onClick={async ()=>{ const np = page+1; setPage(np); await loadDonors(np) }}>Next</button>
                <select className="input" value={pageSize} onChange={async (e)=>{ const v = parseInt(e.target.value,10)||25; setPageSize(v); setPage(1); await loadDonors(1, v) }} style={{width:80}}>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <aside>
            <div style={{border:'1px solid rgba(255,255,255,0.03)', padding:12, borderRadius:8}}>
              <div style={{fontWeight:700, marginBottom:8}}>Add New Donor</div>
              <form onSubmit={handleAddDonor} style={{display:'grid', gap:8}}>
                <input className="input" placeholder="First name" value={newDonor.firstName} onChange={e=>setNewDonor({...newDonor, firstName: e.target.value})} />
                <input className="input" placeholder="Last name" value={newDonor.lastName} onChange={e=>setNewDonor({...newDonor, lastName: e.target.value})} />
                <input className="input" placeholder="Email" value={newDonor.email} onChange={e=>setNewDonor({...newDonor, email: e.target.value})} />
                <input className="input" placeholder="Phone" value={newDonor.phone} onChange={e=>setNewDonor({...newDonor, phone: e.target.value})} />

                <div style={{borderTop:'1px solid rgba(255,255,255,0.03)', paddingTop:8}}>
                  <div style={{fontSize:12, color:'#bbb', marginBottom:6}}>Optional initial donation</div>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                    <input className="input" placeholder="Amount" type="number" min="0" step="0.01" value={newDonor.initialAmount} onChange={e=>setNewDonor({...newDonor, initialAmount: e.target.value})} />
                    <select className="input" value={newDonor.initialCampaignId || ''} onChange={e=>setNewDonor({...newDonor, initialCampaignId: e.target.value})}>
                      <option value="">Apply to (optional)</option>
                      {campaigns.map(c => (<option key={c.id} value={c.id}>{c.name || c.title || c.name}</option>))}
                    </select>
                  </div>
                  <div style={{display:'flex', gap:8, marginTop:8}}>
                    <select className="input" value={newDonor.initialMethod} onChange={e=>setNewDonor({...newDonor, initialMethod: e.target.value})} style={{width:140}}>
                      <option value="CARD">Card</option>
                      <option value="CHECK">Check</option>
                      <option value="CASH">Cash</option>
                      <option value="OTHER">Other</option>
                    </select>
                    <input className="input" placeholder="Notes (gift designation)" value={newDonor.initialNotes} onChange={e=>setNewDonor({...newDonor, initialNotes: e.target.value})} />
                  </div>
                </div>

                <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:6}}>
                  <button type="button" className="btn btn-ghost" onClick={()=>{ setNewDonor({ firstName:'', lastName:'', email:'', phone:'', initialAmount:'', initialCampaignId:'', initialMethod:'CASH', initialNotes:'' }) }}>Cancel</button>
                  <button className="btn btn-primary" disabled={adding}>{adding ? 'Adding...' : 'Add Donor'}</button>
                </div>
              </form>
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

      {editingDonor && (
        <div className="dialog-backdrop">
          <div style={{width:520, background:'var(--color-off-black)', border:'1px solid rgba(255,255,255,0.04)', padding:18, borderRadius:8}}>
            <h3 style={{color:'var(--color-neon)'}}>Edit Donor</h3>
            <form onSubmit={async (e)=>{
              e.preventDefault()
              try {
                setDonorEditErrors(null)
                if (!editingDonor.firstName || editingDonor.firstName.trim()==='') return setDonorEditErrors('First name required')
                if (!editingDonor.email || editingDonor.email.trim()==='') return setDonorEditErrors('Email required')
                const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
                const res = await fetch(`/api/donors/${editingDonor.id}`, { method: 'PUT', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{} ) }, body: JSON.stringify({ firstName: editingDonor.firstName, lastName: editingDonor.lastName, email: editingDonor.email, phone: editingDonor.phone }) })
                if (!res.ok) { const err = await res.json().catch(()=>({})); return setDonorEditErrors('Update failed: '+(err.error||res.status)) }
                setEditingDonor(null)
                await loadDonors()
              } catch (err) { console.warn(err); setDonorEditErrors('Update failed') }
            }} style={{display:'flex', flexDirection:'column', gap:12, marginTop:12}}>
              <label style={{fontSize:12, color:'#bbb'}}>First name</label>
              <input className="input" value={editingDonor.firstName} onChange={e=>setEditingDonor({...editingDonor, firstName: e.target.value})} />
              <label style={{fontSize:12, color:'#bbb'}}>Last name</label>
              <input className="input" value={editingDonor.lastName || ''} onChange={e=>setEditingDonor({...editingDonor, lastName: e.target.value})} />
              <label style={{fontSize:12, color:'#bbb'}}>Email</label>
              <input className="input" value={editingDonor.email || ''} onChange={e=>setEditingDonor({...editingDonor, email: e.target.value})} />
              <label style={{fontSize:12, color:'#bbb'}}>Phone</label>
              <input className="input" value={editingDonor.phone || ''} onChange={e=>setEditingDonor({...editingDonor, phone: e.target.value})} />
              {donorEditErrors && (<div style={{color:'#ff8080'}}>{donorEditErrors}</div>)}
              <div style={{display:'flex', gap:8}}>
                <button className="btn" type="submit">Save</button>
                <button className="btn btn-ghost" type="button" onClick={()=>setEditingDonor(null)}>Cancel</button>
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
            <h3 style={{color:'var(--color-neon)'}}>{fullDonor.donor.firstName} {fullDonor.donor.lastName || ''} - Full History</h3>
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

      {deleteModal && (
        <div className="dialog-backdrop">
          <div style={{width:520, background:'var(--color-off-black)', border:'1px solid rgba(255,255,255,0.04)', padding:18, borderRadius:8}}>
            <h3 style={{color:'var(--color-neon)'}}>Delete Donor</h3>
            <div style={{color:'#ddd', marginTop:8}}>You are about to delete <strong style={{color:'#fff'}}>{deleteModal.firstName} {deleteModal.lastName || ''}</strong>. This will soft-delete the donor and cannot be undone from the UI.</div>
            <p style={{color:'#ffb3b3', fontWeight:700, marginTop:8}}>Enter your admin password to confirm.</p>
            <div style={{marginTop:8}}>
              <input className="input" type="password" value={deletePassword} onChange={e=>setDeletePassword(e.target.value)} placeholder="Admin password" autoComplete="current-password" />
            </div>
            {deleteError && <div style={{color:'#ff8080', marginTop:8}}>{deleteError}</div>}
            <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:12}}>
              <button className="btn btn-ghost" onClick={()=>{ setDeleteModal(null); setDeletePassword(''); setDeleteError(null) }}>Cancel</button>
              <button className="btn btn-danger" onClick={async ()=>{
                try {
                  setDeleteLoading(true); setDeleteError(null)
                  const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
                  const res = await fetch('/api/admin/delete-donor', { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{} ) }, body: JSON.stringify({ id: deleteModal.id, password: deletePassword }) })
                  const data = await res.json().catch(()=>null)
                  if (!res.ok) {
                    setDeleteError(data?.error || 'Delete failed')
                    return
                  }
                  setDeleteModal(null)
                  setDeletePassword('')
                  await loadDonors()
                } catch (err) {
                  console.warn('Delete donor failed', err)
                  setDeleteError('Delete failed')
                } finally { setDeleteLoading(false) }
              }} disabled={deleteLoading || !deletePassword}>{deleteLoading? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
