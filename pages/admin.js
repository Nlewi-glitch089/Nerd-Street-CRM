import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'

export default function Admin() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)

  // dashboard state
  const [metrics, setMetrics] = useState([])
  const [partners, setPartners] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [alerts, setAlerts] = useState([])
  const [donors, setDonors] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [analytics, setAnalytics] = useState(null)

  // missing UI state (added to prevent runtime ReferenceErrors)
  const [tab, setTab] = useState('analytics')
  const [usersList, setUsersList] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [analyticsData, setAnalyticsData] = useState(null)
  const [signOutMessage, setSignOutMessage] = useState(null)
  const [selectedDonor, setSelectedDonor] = useState(null)
  const [campaignsList, setCampaignsList] = useState([])
  const [actionLogs, setActionLogs] = useState([])
  const [selectedRequestsEmail, setSelectedRequestsEmail] = useState(null)
  const [selectedRequests, setSelectedRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [pendingRequestsByEmail, setPendingRequestsByEmail] = useState({})
  // AI decision summary UI state
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [aiMinimized, setAiMinimized] = useState(false)
  const [aiPos, setAiPos] = useState({ left: null, top: null })
  const aiDragRef = useRef({ dragging: false, startX: 0, startY: 0, origLeft: 0, origTop: 0 })
  // AI chat follow-ups
  const [aiChatMessages, setAiChatMessages] = useState([])
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiQuestionLoading, setAiQuestionLoading] = useState(false)
  // AI generate confirmation modal state
  const [aiConfirmOpen, setAiConfirmOpen] = useState(false)
  const [aiConfirmLoading, setAiConfirmLoading] = useState(false)
  const [aiConfirmAgree, setAiConfirmAgree] = useState(false)

  // clear-confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [confirmError, setConfirmError] = useState(null)

  // role-change confirmation modal state (require admin password)
  const [roleChangeModalOpen, setRoleChangeModalOpen] = useState(false)
  const [roleChangeTargetUser, setRoleChangeTargetUser] = useState(null)
  const [roleChangeTargetRole, setRoleChangeTargetRole] = useState(null)
  const [roleChangePassword, setRoleChangePassword] = useState('')
  const [roleChangeLoading, setRoleChangeLoading] = useState(false)
  const [roleChangeError, setRoleChangeError] = useState(null)

  // campaign action confirmation modal (require admin password like Clear All Data)
  const [campaignActionModalOpen, setCampaignActionModalOpen] = useState(false)
  const [campaignActionCampaign, setCampaignActionCampaign] = useState(null)
  const [campaignActionType, setCampaignActionType] = useState(null) // 'approve' | 'deactivate' | 'deny'
  const [campaignActionPassword, setCampaignActionPassword] = useState('')
  const [campaignActionLoading, setCampaignActionLoading] = useState(false)
  const [campaignActionError, setCampaignActionError] = useState(null)
  // manual delete modal state
  const [manualDeleteModalOpen, setManualDeleteModalOpen] = useState(false)
  const [manualDeleteCampaign, setManualDeleteCampaign] = useState(null)
  const [manualDeletePassword, setManualDeletePassword] = useState('')
  const [manualDeleteLoading, setManualDeleteLoading] = useState(false)
  const [manualDeleteError, setManualDeleteError] = useState(null)

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
        // require ADMIN role for this page
        if (data.user.role !== 'ADMIN') {
          if (mounted) setError('Unauthorized — admin access required')
          return
        }
        if (mounted) setUser(data.user)
        // after we set user, load admin datasets
        if (mounted) {
            loadUsers(data.user).catch(()=>{})
          loadCampaigns().catch(()=>{})
          loadAnalytics().catch(()=>{})
          loadDonors().catch(()=>{})
          // load pending requests count for badge
          try { loadPendingRequestsCount().catch(()=>{}); loadPendingRequestsMap().catch(()=>{}) } catch (e) {}
        }
      } catch (err) {
        if (mounted) setError('Network error')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  // attach global listeners for dragging the AI panel (always registered)
  useEffect(() => {
    function onMove(e) {
      if (!aiDragRef.current.dragging) return
      const dx = e.clientX - aiDragRef.current.startX
      const dy = e.clientY - aiDragRef.current.startY
      const left = Math.max(8, aiDragRef.current.origLeft + dx)
      const top = Math.max(8, aiDragRef.current.origTop + dy)
      setAiPos({ left, top })
    }
    function onUp() {
      aiDragRef.current.dragging = false
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [])

  // prepare AI display content (format JSON-like summaries into readable paragraphs)
  const aiDisplay = (() => {
    if (!aiResult) return null
    const out = { parsed: null, paras: [] }
    const s = aiResult.summary
    if (s && typeof s === 'string') {
      const trimmed = s.trim()
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed)
          out.parsed = parsed
          return out
        } catch (e) {
          // not JSON
        }
      }
      // split into paragraphs by double-newline or sentences
      const paras = trimmed.split(/\n\s*\n|\.(?:\s+|$)/).map(p=>p.trim()).filter(Boolean)
      out.paras = paras
      return out
    }
    return out
  })()

          // sample seeder
          async function seedSampleData() {
            try {
              const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
              const res = await fetch('/api/seed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
              })
              if (!res.ok) {
                console.warn('Seed API failed, falling back to local seed')
                const local = localSeed()
                return local
              }
              const data = await res.json()
              setMetrics(data.metrics || [])
              setPartners(data.partners || [])
              setDonors(data.donors || [])
              setCampaigns(data.campaigns || [])
              setRecentActivity(data.recentActivity || [])
              setAlerts(data.alerts || [])
              setAnalytics(data.analytics || null)
              return data
            } catch (err) {
              console.warn('Seed failed', err)
              const local = localSeed()
              return local
            }
          }

          function localSeed() {
            setMetrics([
              { title: 'Active Programs', value: '1', sub: 'Running programs' },
              { title: 'Total Revenue', value: '$500,000', sub: 'From all programs' },
              { title: 'Team Reminders', value: '0', sub: 'Action items pending' }
            ])

            setPartners([
              { name: 'GameStop', tag: 'At Risk', health: '45%' },
              { name: 'Discord', tag: 'Pending', health: '70%' },
              { name: 'Alienware', tag: 'Active', health: '85%' },
              { name: 'Red Bull Gaming', tag: 'Active', health: '92%' }
            ])

            setDonors([
              { name: 'Nate Marshall', totalGiving: '$12,500', lastGift: 'Mar 3, 2025' },
              { name: 'Evelyn Hart', totalGiving: '$4,200', lastGift: 'Jan 12, 2025' }
            ])

            setCampaigns([
              { title: 'Spring Fundraiser 2025', goal: '$75,000', raised: '$12,000' },
              { title: 'Community Outreach Q2', goal: '$20,000', raised: '$5,000' }
            ])

            setRecentActivity([
              { title: 'Alienware', kind: 'Email', note: 'Equipment delivery confirmed for new venue opening.', date: 'Dec 7, 2025' },
              { title: 'Red Bull Gaming', kind: 'Meeting', note: 'Discussed Q1 2025 tournament schedule and activation opportunities.', date: 'Dec 4, 2025' }
            ])

            setAlerts([
              { title: 'Alienware', note: 'Send co-marketing proposal and content calendar — Due: Dec 14, 2025' },
              { title: 'Red Bull Gaming', note: 'Reach out to discuss 2025 renewal terms — Due: Dec 19, 2025' }
            ])

            setAnalytics({ visitors: 1234, conversions: 42, revenue: 500000 })

            return {
              metrics: [
                { title: 'Active Programs', value: '1', sub: 'Running programs' },
                { title: 'Total Revenue', value: '$500,000', sub: 'From all programs' },
                { title: 'Team Reminders', value: '0', sub: 'Action items pending' }
              ],
              partners: [
                { name: 'GameStop', tag: 'At Risk', health: '45%' },
                { name: 'Discord', tag: 'Pending', health: '70%' },
                { name: 'Alienware', tag: 'Active', health: '85%' },
                { name: 'Red Bull Gaming', tag: 'Active', health: '92%' }
              ],
              donors: [
                { name: 'Nate Marshall', totalGiving: '$12,500', lastGift: 'Mar 3, 2025' },
                { name: 'Evelyn Hart', totalGiving: '$4,200', lastGift: 'Jan 12, 2025' }
              ],
              campaigns: [
                { title: 'Spring Fundraiser 2025', goal: '$75,000', raised: '$12,000' },
                { title: 'Community Outreach Q2', goal: '$20,000', raised: '$5,000' }
              ],
              recentActivity: [
                { title: 'Alienware', kind: 'Email', note: 'Equipment delivery confirmed for new venue opening.', date: 'Dec 7, 2025' },
                { title: 'Red Bull Gaming', kind: 'Meeting', note: 'Discussed Q1 2025 tournament schedule and activation opportunities.', date: 'Dec 4, 2025' }
              ],
              alerts: [
                { title: 'Alienware', note: 'Send co-marketing proposal and content calendar — Due: Dec 14, 2025' },
                { title: 'Red Bull Gaming', note: 'Reach out to discuss 2025 renewal terms — Due: Dec 19, 2025' }
              ],
              analytics: { visitors: 1234, conversions: 42, revenue: 500000 }
            }
          }

          // fetch helpers
          async function loadUsers(currentUser) {
            try {
              const res = await fetch('/api/users')
              const data = await res.json()

              // If analytics data is empty, attempt a seed and prefer seeded analytics
              let finalData = data
              const hasNoData = !data || ((data.totalRevenue === 0 || data.totalRevenue == null) && (data.totalDonors === 0 || data.totalDonors == null) && (!Array.isArray(data.campaignStats) || data.campaignStats.length === 0))
              if (hasNoData) {
                try {
                  const seeded = await seedSampleData()
                  if (seeded) finalData = seeded.analytics || seeded
                } catch (e) {
                  console.warn('Auto-seed failed', e)
                }
              }

              setAnalyticsData(finalData)
              // populate usersList from the API if provided
              let users = []
              if (Array.isArray(data)) users = data
              else if (Array.isArray(data?.users)) users = data.users
              else if (Array.isArray(finalData?.users)) users = finalData.users
              // if still empty, include the currently-signed-in admin user so management UI isn't blank
              if (!users || users.length === 0) {
                 try { if (currentUser) users = [currentUser]; else if (user) users = [user] } catch (e) { users = [] }
              }
              setUsersList(users || [])
            } catch (e) {
              console.warn('loadUsers failed', e)
            }
          }

              async function loadPendingRequestsCount() {
                try {
                  const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
                  const res = await fetch('/api/admin/request-access/list', { headers: { ...(token?{ Authorization:`Bearer ${token}` }:{} ) } })
                  if (!res.ok) return
                  const d = await res.json().catch(()=>null)
                  const rows = Array.isArray(d?.requests) ? d.requests : []
                  const pending = rows.filter(r => (r.status || '').toUpperCase() === 'PENDING').length
                  setPendingRequestsCount(pending)
                } catch (e) { console.warn('loadPendingRequestsCount failed', e) }
              }

              async function loadPendingRequestsMap() {
                try {
                  const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
                  const res = await fetch('/api/admin/request-access/list', { headers: { ...(token?{ Authorization:`Bearer ${token}` }:{} ) } })
                  if (!res.ok) return
                  const d = await res.json().catch(()=>null)
                  const rows = Array.isArray(d?.requests) ? d.requests : []
                  const map = {}
                  for (const r of rows) {
                    const e = (r.requesterEmail || '').toLowerCase()
                    if (!map[e]) map[e] = 0
                    if ((r.status || '').toUpperCase() === 'PENDING') map[e] += 1
                  }
                  setPendingRequestsByEmail(map)
                } catch (e) { console.warn('loadPendingRequestsMap failed', e) }
              }

          // load donors so the admin dashboard shows live donor/donation data on sign-in
          async function loadDonors(){
            try{
              const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
              const res = await fetch('/api/donors', { headers: { ...(token?{ Authorization:`Bearer ${token}` }:{} ) } })
              if (!res.ok) {
                console.warn('loadDonors: /api/donors responded', res.status)
                // still attempt to load analytics as a fallback
              }
              const data = await res.json().catch(()=>null)
              const list = (data && data.donors) ? data.donors : []
              if (!list || list.length === 0) {
                // attempt to seed server-side data and reload
                try {
                  const seeded = await seedSampleData()
                  if (seeded && Array.isArray(seeded.donors)) {
                    setDonors(seeded.donors)
                    return
                  }
                } catch (e) { console.warn('Auto-seed donors failed', e) }
                setDonors([])
                return
              }
              // try to enrich donors with analytics donorStats when available
              try{
                const aRes = await fetch('/api/analytics')
                if (aRes.ok) {
                  const aData = await aRes.json()
                  const map = (aData.donorStats || []).reduce((acc,x)=>{ acc[x.id]=x; return acc }, {})
                  const enriched = list.map(d => ({ ...d, totalGiving: (map[d.id] && (map[d.id].totalGiving || map[d.id].totalGiving)) || d.totalGiving || 0, giftedTotal: (map[d.id] && (map[d.id].giftedTotal || map[d.id].gifted)) || (d.giftedTotal || 0) }))
                  setDonors(enriched)
                  return
                }
                setDonors(list)
              }catch(e){ console.warn('Enrich donors failed', e); setDonors(list) }
            }catch(e){ console.warn('loadDonors failed', e) }
          }

          async function loadCampaigns(){
            try{
              const res = await fetch('/api/campaigns')
              if (!res.ok) return
              const data = await res.json()
              // If there are no campaigns returned, attempt to seed sample data
              if (!data || !Array.isArray(data.campaigns) || data.campaigns.length === 0) {
                try {
                  const seeded = await seedSampleData()
                  if (seeded && Array.isArray(seeded.campaigns)) {
                    setCampaigns(seeded.campaigns)
                    setCampaignsList(seeded.campaigns)
                    // seeded also populates donors and analytics via seedSampleData
                    return
                  }
                } catch (e) {
                  console.warn('Auto-seed for campaigns failed', e)
                }
              }
              setCampaigns(data.campaigns || [])
              setCampaignsList(data.campaigns || [])
            }catch(e){ console.warn(e) }
          }

          async function loadAnalytics(){
            try{
              const res = await fetch('/api/analytics')
              if (!res.ok) return
              const data = await res.json()
              // If analytics response is empty or missing expected arrays, try seeding
              const missing = !data || ((data.totalRevenue === 0 || data.totalRevenue == null) && (!Array.isArray(data.campaignStats) || data.campaignStats.length === 0))
              if (missing) {
                try {
                  const seeded = await seedSampleData()
                  if (seeded) {
                    setAnalyticsData(seeded.analytics || seeded)
                    return
                  }
                } catch (e) {
                  console.warn('Auto-seed for analytics failed', e)
                }
              }
              // Try to enrich analytics campaignStats with donation-derived totals from /api/campaigns
              try {
                const campRes = await fetch('/api/campaigns')
                if (campRes.ok) {
                  const campData = await campRes.json()
                  const apiCampaigns = Array.isArray(campData.campaigns) ? campData.campaigns : []
                  if (Array.isArray(data.campaignStats) && data.campaignStats.length > 0 && apiCampaigns.length > 0) {
                    const mapById = apiCampaigns.reduce((acc, c) => { if (c.id) acc[c.id] = c; acc[c.name] = acc[c.name] || c; return acc }, {})
                    const merged = data.campaignStats.map(cs => {
                      // prefer analytics values but fill in when missing or zero using API totals
                      const found = (cs.id && mapById[cs.id]) || mapById[cs.name]
                      if (!found) return cs
                      const analyticsRaised = Number(cs.raised || 0)
                      const apiRaised = Number(found.raised || found.raisedAmount || 0)
                      const analyticsGifted = Number(cs.gifted || cs.giftedRaised || 0)
                      const apiGifted = Number(found.giftedRaised || found.gifted || 0)
                      // If analytics shows 0 but API shows funds, prefer API totals
                      const finalRaised = (analyticsRaised && analyticsRaised > 0) ? analyticsRaised : apiRaised
                      const finalGifted = (analyticsGifted && analyticsGifted > 0) ? analyticsGifted : apiGifted
                      return { ...cs, raised: finalRaised, gifted: finalGifted }
                    })
                    data.campaignStats = merged
                  }
                }
              } catch (e) {
                console.warn('Failed to enrich analytics with /api/campaigns data', e)
              }

              setAnalyticsData(data || null)
            }catch(e){ console.warn(e) }
          }

          // AI decision summary fetcher (admin-only)
          async function fetchDecisionSummary() {
            try {
              setAiLoading(true)
              setAiResult(null)
              const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
              const res = await fetch('/api/admin/decision-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token?{ Authorization: `Bearer ${token}` }:{} ) },
                body: JSON.stringify({})
              })
              const data = await res.json().catch(()=>null)
              if (!res.ok) throw new Error(data?.error || JSON.stringify(data) || 'Request failed')
              setAiResult(data.result || data)
            } catch (err) {
              setAiResult({ error: String(err) })
            } finally {
              setAiLoading(false)
            }
          }

          // Download current AI result as a JSON file
          function downloadAiResult() {
            try {
              if (!aiResult) return
              const now = new Date()
              const pad = (n) => String(n).padStart(2, '0')
              const ts = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
              const filename = `decision-summary-${ts}.json`
              const blob = new Blob([JSON.stringify(aiResult, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = filename
              document.body.appendChild(a)
              a.click()
              a.remove()
              URL.revokeObjectURL(url)
            } catch (e) {
              console.warn('Download failed', e)
              alert('Download failed: ' + String(e))
            }
          }

          // color helpers
          const tagColor = (tag) => {
            if (!tag) return '#999'
            const t = String(tag).toLowerCase()
            if (t.includes('risk')) return '#ff4d4d'
            if (t.includes('pending')) return '#ffcc00'
            if (t.includes('active')) return 'var(--color-neon)'
            return '#999'
          }

          const healthColor = (percent) => {
            const p = parseInt(String(percent || '').replace('%','') || '0', 10)
            if (p >= 85) return 'var(--color-neon, #39ff14)'
            if (p >= 60) return '#ffcc00'
            return '#ff4d4d'
          }

          // sign-out handler: clear client state, show brief toast, then redirect to auth page
          function handleSignOut() {
            try { localStorage.removeItem('token') } catch (e) { console.warn('removeItem token failed', e) }
            try { 
              // clear client-side state
              setUser(null)
              setAnalyticsData(null)
              setCampaignsList([])
              setUsersList([])
              setMetrics([])
              setPartners([])
              setRecentActivity([])
              setAlerts([])
              setDonors([])
              setCampaigns([])
              setSeedResponseData && setSeedResponseData(null)
              setSeedError && setSeedError(null)
              setSeedLoading && setSeedLoading(false)
            } catch (e) { console.warn('Error clearing client state', e) }
            try {
              console.log('Signing out: clearing client state and redirecting to signin')
              // navigate immediately to signin after clearing state to avoid flashing dashboard
              try { router.replace('/signin') } catch (e) { console.warn('router.replace failed during sign-out', e); try { window.location.href = '/signin' } catch (err) { console.warn('Fallback redirect failed', err) } }
            } catch (e) {
              try { window.location.href = '/signin' } catch (err) { console.warn('Redirect failed', err) }
            }
          }

          // seed persistence state + handler
          const [seedLoading, setSeedLoading] = useState(false)
          const [seedError, setSeedError] = useState(null)
          const [seedModalOpen, setSeedModalOpen] = useState(false)
          const [seedResponseData, setSeedResponseData] = useState(null)

          // derive dashboard metrics from live analytics/campaigns/alerts; prefer `analyticsData` when available
          const displayMetrics = (() => {
            // prefer live analytics if present
            if (analyticsData) {
              const campaignSum = Array.isArray(analyticsData.campaignStats) ? analyticsData.campaignStats.reduce((s,c)=>s + (Number(c.raised||0)||0),0) : 0
              const donationsSum = Array.isArray(analyticsData.donorStats) ? analyticsData.donorStats.reduce((s,d)=>s + (Number(d.totalGiving||0)||0),0) : 0
              const giftedSum = Array.isArray(analyticsData.campaignStats) ? analyticsData.campaignStats.reduce((s,c)=>s + (Number(c.gifted || c.giftedRaised || 0)||0),0) : 0
              // Total revenue = donations (donor-given money) + gifted/in-kind amounts from campaigns
              const totalCombined = (donationsSum || 0) + (giftedSum || 0)
              return [
                { title: 'Campaign Revenue', value: '$' + (campaignSum.toLocaleString ? campaignSum.toLocaleString() : campaignSum), sub: 'From campaign allocations (donations + gifted)' },
                { title: 'Donations', value: '$' + (donationsSum.toLocaleString ? donationsSum.toLocaleString() : donationsSum), sub: 'Monetary gifts from donors' },
                { title: 'Total Revenue', value: '$' + (totalCombined.toLocaleString ? totalCombined.toLocaleString() : totalCombined), sub: 'Donations + in-kind / gifted amounts' }
              ]
            }
            // otherwise fall back to any provided metrics array
            if (Array.isArray(metrics) && metrics.length > 0) return metrics
            return metrics || []
          })()

          async function persistSeed() {
            try {
              setSeedError(null)
              setSeedLoading(true)
              const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
              const res = await fetch('/api/seed', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token?{ Authorization: `Bearer ${token}` }:{} ) } })
              const data = await res.json().catch(()=>null)
              if (!res.ok) {
                const msg = data?.error || 'Seed failed'
                const details = data?.details || data?.stack || null
                setSeedError(msg + (details ? ` — ${details}` : ''))
                console.error('Seed API failed response:', data)
                alert(`Seed failed: ${msg}${details ? '\n\nDetails:\n' + details : ''}`)
                return
              }
              // refresh admin datasets using the current signed-in user
              try { await Promise.all([loadUsers(user).catch(()=>{}), loadCampaigns().catch(()=>{}), loadAnalytics().catch(()=>{})]) } catch (e) { console.warn('Reload after seed failed', e) }
              alert('Seed persisted to database.')
            } catch (err) {
              setSeedError(String(err))
              console.warn('persistSeed error', err)
              alert('Seed error: ' + String(err))
            } finally {
              setSeedLoading(false)
            }
          }

          // persistSeedShow: runs the seeder and stores the full server response in state for inspection
          async function persistSeedShow() {
            setSeedError(null)
            setSeedLoading(true)
            setSeedResponseData(null)
            setSeedModalOpen(true)
            try {
              const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
              const res = await fetch('/api/seed', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token?{ Authorization: `Bearer ${token}` }:{} ) } })
              const data = await res.json().catch(()=>null)
              setSeedResponseData({ status: res.status, ok: res.ok, body: data })
              if (!res.ok) {
                const msg = data?.error || 'Seed failed'
                const details = data?.details || data?.stack || null
                setSeedError(msg + (details ? ` — ${details}` : ''))
                console.error('Seed API failed response:', data)
                return
              }
              // refresh admin datasets using the current signed-in user
              try { await Promise.all([loadUsers(user).catch(()=>{}), loadCampaigns().catch(()=>{}), loadAnalytics().catch(()=>{})]) } catch (e) { console.warn('Reload after seed failed', e) }
            } catch (err) {
              setSeedError(String(err))
              console.warn('persistSeedShow error', err)
              setSeedResponseData({ status: 'error', ok: false, body: String(err) })
            } finally {
              setSeedLoading(false)
            }
          }

          if (loading) {
            return null // already handled above
          }

                  return (
            <div style={{padding:20}}>
              <header style={{display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'2px solid rgba(57,255,20,0.06)', paddingBottom:12}}>
                <div>
                  <div style={{color:'var(--color-neon, #39ff14)', fontWeight:700}}>ADMIN DASHBOARD</div>
                  <div style={{fontSize:13, color:'#ccc'}}>Organization Overview - {(user && (user.name || user.email)) || '...'}</div>
                  {/* debug: show whether metrics are from live analytics or seeded/local data */}
                  {(() => {
                    try { console.debug('analyticsData (admin):', analyticsData) } catch (e) {}
                    const isLive = !!(analyticsData && ((analyticsData.totalRevenue != null && analyticsData.totalRevenue !== 0) || (Array.isArray(analyticsData.campaignStats) && analyticsData.campaignStats.length > 0) || (analyticsData.revenue != null && analyticsData.revenue !== 0)))
                    return (
                      <div style={{marginTop:6, fontSize:12}}>
                        <span style={{color:'#bbb', marginRight:8}}>Data source:</span>
                        <span style={{padding:'2px 8px', borderRadius:6, background:isLive? 'rgba(57,255,20,0.12)':'rgba(255,77,77,0.06)', color:isLive? 'var(--color-neon)':'#ff9a9a', fontWeight:700}}>{isLive? 'Live' : 'Seeded / Local'}</span>
                      </div>
                    )
                  })()}
                </div>
                <div style={{display:'flex', gap:12}}>
                  {/* Persist Seed button removed for production-like admin UX; seeding still runs automatically when APIs return empty data. */}
                  <button className="btn btn-ghost" onClick={handleSignOut}>Logout</button>
                </div>
              </header>

              {signOutMessage && (
                <div style={{position:'fixed', right:20, top:20, background:'rgba(0,0,0,0.8)', color:'var(--color-neon)', padding:'10px 14px', borderRadius:8, border:'1px solid rgba(57,255,20,0.08)'}}>
                  {signOutMessage}
                </div>
              )}

              {/* Top dashboard metrics removed per request. */}

              {/* Tabs for admin sections */}
              <div style={{marginTop:18}}>
                <div style={{display:'flex', gap:12}}>
                    <button className={`btn ${tab==='users'?'btn-primary':''}`} onClick={()=>setTab('users')}>User Management{pendingRequestsCount>0 && <span style={{marginLeft:8, background:'#ffb86b', color:'#000', padding:'2px 6px', borderRadius:12, fontSize:12, fontWeight:700}}>{pendingRequestsCount}</span>}</button>
                  <button className={`btn ${tab==='approvals'?'btn-primary':''}`} onClick={()=>setTab('approvals')}>Campaign Approvals</button>
                  <button className={`btn ${tab==='analytics'?'btn-primary':''}`} onClick={()=>setTab('analytics')}>Full Analytics</button>
                  <div style={{marginLeft:'auto', display:'flex', gap:8}}>
                      <button className="btn" onClick={()=>setAiConfirmOpen(true)} disabled={aiLoading}>{aiLoading ? 'Generating…' : '🤖 Generate AI Decision Summary'}</button>
                    <button className="btn" onClick={()=>{ window.location.href = '/admin/donors' }}>View Donors</button>
                    <button className="btn" onClick={()=>{ window.location.href = '/admin/campaigns' }}>View Campaigns</button>
                      <button className="btn btn-danger" onClick={() => { setConfirmOpen(true) }} style={{background:'#ff4d4d', color:'#fff', border:'1px solid rgba(255,77,77,0.9)'}}>Clear All Data</button>
                      {/* History moved to Admin Settings */}
                  </div>
                </div>

                <div style={{marginTop:12}}>
                  {tab==='users' && (
                    <div style={{border:'1px solid rgba(57,255,20,0.08)', padding:16, borderRadius:8}}>
                      <div style={{color:'var(--color-neon)', fontWeight:700}}>User Management</div>
                      <div style={{fontSize:13, color:'#bbb', marginBottom:8}}>Manage user roles and permissions</div>
                      <input className="input" placeholder="Search users..." value={userSearch} onChange={e=>setUserSearch(e.target.value)} />
                      <div style={{marginTop:12, display:'flex', flexDirection:'column', gap:10}}>
                        {(usersList.filter(u => (u.name||u.email||'').toLowerCase().includes(userSearch.toLowerCase()) )).map(u=> (
                          <div key={u.id} style={{display:'flex', flexDirection:'column', gap:8}}>
                            <div style={{padding:12, border:'1px solid rgba(255,255,255,0.03)', borderRadius:6, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                              <div>
                                <div style={{fontWeight:700}}>
                                  {u.name} <span style={{background:u.role==='ADMIN'? 'var(--color-neon)':'#444', color:'#000', padding:'2px 6px', borderRadius:6, fontSize:12, marginLeft:8}}>{u.role.toLowerCase()}</span>
                                  {((pendingRequestsByEmail[((u.email||'').toLowerCase())] || 0) > 0) && (
                                    <span style={{marginLeft:8, background:'#ffb86b', color:'#000', padding:'2px 6px', borderRadius:12, fontSize:12, fontWeight:700}}>{pendingRequestsByEmail[((u.email||'').toLowerCase())]}</span>
                                  )}
                                </div>
                                <div style={{fontSize:12, color:'#bbb'}}>{u.email}</div>
                              </div>
                              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                                {u.role !== 'ADMIN' ? (
                                  <button className="btn" onClick={()=>{ setRoleChangeTargetUser(u); setRoleChangeTargetRole('ADMIN'); setRoleChangePassword(''); setRoleChangeError(null); setRoleChangeModalOpen(true) }}>Promote to Admin</button>
                                ) : (
                                  <button className="btn btn-ghost" onClick={()=>{ setRoleChangeTargetUser(u); setRoleChangeTargetRole('TEAM_MEMBER'); setRoleChangePassword(''); setRoleChangeError(null); setRoleChangeModalOpen(true) }}>Set as Team Member</button>
                                )}
                                <button className="btn btn-ghost" onClick={async ()=>{
                                  try {
                                    const norm = (u.email || '').toLowerCase()
                                    if (selectedRequestsEmail === norm) {
                                      // toggle closed
                                      setSelectedRequestsEmail(null)
                                      setSelectedRequests([])
                                      return
                                    }
                                    setRequestsLoading(true)
                                    const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
                                    const res = await fetch(`/api/admin/request-access?email=${encodeURIComponent(u.email)}`, { headers: { ...(token?{ Authorization:`Bearer ${token}` }:{} ) } })
                                    if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.error || 'Failed') }
                                    const data = await res.json()
                                    setSelectedRequestsEmail(norm)
                                    setSelectedRequests(data.requests || [])
                                  } catch (e) {
                                    console.warn('Load user requests failed', e)
                                    alert('Failed to load requests')
                                  } finally { setRequestsLoading(false) }
                                }}>{requestsLoading && selectedRequestsEmail===(u.email||'').toLowerCase() ? 'Loading…' : 'Requests'}</button>
                              </div>
                            </div>
                            {selectedRequestsEmail === (u.email || '').toLowerCase() && (
                              <div style={{marginTop:8, padding:12, border:'1px dashed rgba(255,255,255,0.03)', borderRadius:6, background:'#070707'}}>
                                {selectedRequests.length === 0 ? (
                                  <div style={{color:'#888'}}>No requests for this user.</div>
                                ) : (
                                  selectedRequests.map(r => (
                                    <div key={r.id} style={{display:'flex', justifyContent:'space-between', gap:12, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.02)'}}>
                                      <div>
                                        <div style={{fontWeight:700}}>{r.scope} <span style={{fontWeight:400, marginLeft:8, color:'#bbb'}}>{r.status}</span></div>
                                        <div style={{color:'#bbb', marginTop:6}}>{r.note}</div>
                                        <div style={{color:'#777', fontSize:12, marginTop:6}}>Requested: {new Date(r.createdAt).toLocaleString()}</div>
                                      </div>
                                      <div style={{minWidth:140, display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end'}}>
                                        {r.status === 'PENDING' ? (
                                          <>
                                            <button className="btn btn-primary" onClick={async ()=>{
                                              try {
                                                const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
                                                const res = await fetch(`/api/admin/request-access/${r.id}/decision`, { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{} ) }, body: JSON.stringify({ decision: 'APPROVE' }) })
                                                if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.error || 'Failed') }
                                                // refresh
                                                const rr = await fetch(`/api/admin/request-access?email=${encodeURIComponent(u.email)}`, { headers: { ...(token?{ Authorization:`Bearer ${token}` }:{} ) } })
                                                const d2 = await rr.json().catch(()=>({})); setSelectedRequests(d2.requests || [])
                                              } catch (e) { alert('Approve failed: ' + (e.message||e)) }
                                              try { await loadPendingRequestsCount().catch(()=>{}); await loadPendingRequestsMap().catch(()=>{}) } catch (e) {}
                                            }}>Approve</button>
                                            <button className="btn btn-ghost" onClick={async ()=>{
                                              try {
                                                const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
                                                const res = await fetch(`/api/admin/request-access/${r.id}/decision`, { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{} ) }, body: JSON.stringify({ decision: 'DENY' }) })
                                                if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.error || 'Failed') }
                                                const rr = await fetch(`/api/admin/request-access?email=${encodeURIComponent(u.email)}`, { headers: { ...(token?{ Authorization:`Bearer ${token}` }:{} ) } })
                                                const d2 = await rr.json().catch(()=>({})); setSelectedRequests(d2.requests || [])
                                                } catch (e) { alert('Deny failed: ' + (e.message||e)) }
                                                try { await loadPendingRequestsCount().catch(()=>{}); await loadPendingRequestsMap().catch(()=>{}) } catch (e) {}
                                            }}>Deny</button>
                                          </>
                                        ) : (
                                          <div style={{color:'#aaa'}}>{r.status}</div>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tab==='approvals' && (
                    <div style={{border:'1px solid rgba(57,255,20,0.08)', padding:16, borderRadius:8}}>
                      <div style={{color:'var(--color-neon)', fontWeight:700}}>Campaign Approvals</div>
                      <div style={{fontSize:13, color:'#bbb', marginBottom:8}}>Review and approve events/campaigns</div>
                      <div style={{marginTop:12, display:'flex', flexDirection:'column', gap:12}}>
                        {(!campaignsList || campaignsList.length===0) ? (
                          <div style={{color:'#888'}}>No campaigns yet.</div>
                        ) : (
                          // dedupe by name so duplicate seed entries don't show repeatedly
                          (() => {
                            const deduped = Object.values((campaignsList || []).reduce((acc, c) => { if (!acc[c.name]) acc[c.name] = c; return acc }, {}))
                            // Only show campaigns that are approved (or have funds which implies approved)
                            const approvedOnly = deduped.filter(c => {
                              const raised = Number(c.raised || 0)
                              return !!(c.approved || raised > 0)
                            })
                            if (approvedOnly.length === 0) return <div style={{color:'#888'}}>No approved campaigns.</div>
                            return approvedOnly.map(c => {
                              const raised = Number(c.raised || 0)
                              const isApproved = !!(c.approved || raised > 0)
                              return (
                                <div key={c.id || c.name} style={{padding:12, border:'1px solid rgba(255,255,255,0.03)', borderRadius:6, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                  <div>
                                    <div style={{fontWeight:700}}>{c.name} <span style={{background:isApproved? 'rgba(47,255,85,0.06)':'rgba(255,193,7,0.06)', color:isApproved? 'var(--color-neon)':'#ffd57a', padding:'2px 6px', borderRadius:6, fontSize:12, marginLeft:8}}>{isApproved? 'Approved' : (raised > 0 ? 'Pending (has funds)' : 'Pending')}</span></div>
                                    <div style={{fontSize:12, color:'#bbb'}}>Raised: ${raised.toLocaleString ? raised.toLocaleString() : raised}</div>
                                  </div>
                                  <div style={{minWidth:220, textAlign:'right', color:'#bbb', display:'flex', gap:8, justifyContent:'flex-end'}}>
                                    <button className="btn" onClick={()=>{ setCampaignActionCampaign(c); setCampaignActionType('approve'); setCampaignActionPassword(''); setCampaignActionError(null); setCampaignActionModalOpen(true) }} disabled={isApproved}>Approve</button>
                                    <button className="btn btn-ghost" onClick={()=>{ setCampaignActionCampaign(c); setCampaignActionType('deactivate'); setCampaignActionPassword(''); setCampaignActionError(null); setCampaignActionModalOpen(true) }} disabled={!isApproved}>Deactivate</button>
                                    {/* Only show Deny for campaigns that are not approved */}
                                    {!isApproved && (
                                      <button className="btn btn-danger" onClick={()=>{ if (!confirm('Deny this campaign? This will mark it as not approved.')) return; setCampaignActionCampaign(c); setCampaignActionType('deny'); setCampaignActionPassword(''); setCampaignActionError(null); setCampaignActionModalOpen(true) }}>
                                        Deny
                                      </button>
                                    )}
                                    <button className="btn btn-outline-danger" onClick={()=>{ if (!confirm('Delete this campaign? This will remove the campaign and its donations.')) return; setManualDeleteCampaign(c); setManualDeletePassword(''); setManualDeleteError(null); setManualDeleteModalOpen(true) }} style={{marginLeft:8}}>Delete</button>
                                  </div>
                                </div>
                              )
                            })
                          })()
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick campaigns summary on the dashboard area (shows per-campaign breakdown and actions) */}
                  {tab !== 'approvals' && tab !== 'users' && analyticsData && Array.isArray(analyticsData.campaignStats) && analyticsData.campaignStats.length > 0 && (
                    <div style={{marginTop:18, marginBottom:28}}>
                      <div style={{color:'var(--color-neon)', fontWeight:700, marginBottom:8}}>Campaigns Quick</div>
                      <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12}}>
                        {analyticsData.campaignStats.map(c => {
                          const raisedAll = Number(c.raised || 0)
                          const gifted = Number(c.gifted || 0)
                          const donationsOnly = Math.max(0, raisedAll - gifted)
                          const goal = Number(c.goal || 0) || 0
                          const progress = goal ? Math.min(100, Math.round((raisedAll / goal) * 100)) : 0
                          const isApproved = !!(c.approved || raisedAll > 0)
                          return (
                            <div key={c.id} style={{padding:12, border:'1px solid rgba(255,255,255,0.03)', borderRadius:8, background:'#070707'}}>
                              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <div>
                                  <div style={{fontWeight:700}}>{c.name}</div>
                                  <div style={{fontSize:12, color:'#bbb'}}>Goal: ${goal.toLocaleString ? goal.toLocaleString() : goal}</div>
                                </div>
                                <div style={{textAlign:'right'}}>
                                  <div style={{fontWeight:700}}>${raisedAll.toLocaleString ? raisedAll.toLocaleString() : raisedAll}</div>
                                  <div style={{fontSize:12, color:'#bbb'}}>{progress}%</div>
                                </div>
                              </div>
                              <div style={{display:'flex', gap:8, marginTop:8}}>
                                <div style={{flex:1, fontSize:13}}>
                                  <div style={{color:'#bbb'}}>Donations: <strong style={{color:'var(--color-neon)'}}>${donationsOnly.toLocaleString ? donationsOnly.toLocaleString() : donationsOnly}</strong></div>
                                  <div style={{color:'#bbb'}}>In-Kind Gifts: <strong style={{color:'#9be'}}>${gifted.toLocaleString ? gifted.toLocaleString() : gifted}</strong></div>
                                </div>
                                <div style={{display:'flex', flexDirection:'column', gap:6, minWidth:180, alignItems:'flex-end'}}>
                                  <div style={{display:'flex', gap:8}}>
                                    <button className="btn" onClick={()=>{ setCampaignActionCampaign(c); setCampaignActionType('approve'); setCampaignActionPassword(''); setCampaignActionError(null); setCampaignActionModalOpen(true) }} disabled={isApproved}>Approve</button>
                                    <button className="btn btn-ghost" onClick={()=>{ setCampaignActionCampaign(c); setCampaignActionType('deactivate'); setCampaignActionPassword(''); setCampaignActionError(null); setCampaignActionModalOpen(true) }} disabled={!isApproved}>Deactivate</button>
                                    <button className="btn btn-outline-danger" onClick={()=>{ if (!confirm('Delete this campaign? This will remove the campaign and its donations.')) return; setManualDeleteCampaign(c); setManualDeletePassword(''); setManualDeleteError(null); setManualDeleteModalOpen(true) }} style={{marginLeft:6}}>Delete</button>
                                  </div>
                                  <div style={{fontSize:12, color:isApproved? 'var(--color-neon)':'#ffd57a'}}>{isApproved? 'Approved' : 'Pending'}</div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {tab==='analytics' && (
                    <div style={{border:'1px solid rgba(57,255,20,0.08)', padding:16, borderRadius:8}}>
                      <div style={{color:'var(--color-neon)', fontWeight:700}}>Full Analytics</div>
                      <div style={{fontSize:13, color:'#bbb', marginBottom:8}}>Complete financial overview across all partners</div>
                      {!analyticsData ? (
                        <div style={{color:'#888'}}>No analytics available. Seed data and try again.</div>
                      ) : (
                        <div>
                          <div style={{display:'flex', gap:12}}>
                            {(() => {
                                const campaignSum = Array.isArray(analyticsData?.campaignStats) ? analyticsData.campaignStats.reduce((s,c)=>s + (Number(c.raised||0)||0),0) : 0
                                const donationsSum = Array.isArray(analyticsData?.donorStats) ? analyticsData.donorStats.reduce((s,d)=>s + (Number(d.totalGiving||0)||0),0) : 0
                                const giftedSum = Array.isArray(analyticsData?.campaignStats) ? analyticsData.campaignStats.reduce((s,c)=>s + (Number(c.gifted || c.giftedRaised || 0)||0),0) : 0
                                const totalCombined = (donationsSum || 0) + (giftedSum || 0)
                                const donorsCount = analyticsData?.totalDonors ?? analyticsData?.donorCount ?? 0
                                const activePrograms = Array.isArray(analyticsData?.campaignStats) ? analyticsData.campaignStats.length : (Array.isArray(campaignsList) ? campaignsList.length : 0)
                              return (
                                <>
                                  <div style={{flex:1, border:'1px solid rgba(255,255,255,0.03)', padding:12, borderRadius:6}}>
                                    <div style={{color:'var(--color-neon)', fontWeight:700}}>Active Programs</div>
                                    <div style={{fontSize:24, marginTop:8}}>{String(activePrograms)}</div>
                                  </div>
                                  <div style={{flex:1, border:'1px solid rgba(255,255,255,0.03)', padding:12, borderRadius:6}}>
                                    <div style={{color:'var(--color-neon)', fontWeight:700}}>Campaign Revenue</div>
                                    <div style={{fontSize:24, marginTop:8}}>${(campaignSum).toLocaleString ? (campaignSum).toLocaleString() : campaignSum}</div>
                                  </div>
                                  <div style={{flex:1, border:'1px solid rgba(255,255,255,0.03)', padding:12, borderRadius:6}}>
                                    <div style={{color:'var(--color-neon)', fontWeight:700}}>Donations</div>
                                    <div style={{fontSize:24, marginTop:8}}>${(donationsSum).toLocaleString ? (donationsSum).toLocaleString() : donationsSum}</div>
                                  </div>
                                  <div style={{flex:1, border:'1px solid rgba(255,255,255,0.03)', padding:12, borderRadius:6}}>
                                    <div style={{color:'var(--color-neon)', fontWeight:700}}>Total Revenue</div>
                                    <div style={{fontSize:24, marginTop:8}}>${(totalCombined).toLocaleString ? (totalCombined).toLocaleString() : totalCombined}</div>
                                  </div>
                                </>
                              )
                            })()}
                          </div>

                          <div style={{marginTop:20}}>
                            <div style={{color:'var(--color-neon)', fontWeight:700, marginBottom:8}}>All Campaigns</div>
                              {(analyticsData.campaignStats || []).map(c => {
                              const raisedAll = Number(c.raised || 0)
                              const raisedGifted = (c.gifted || c.giftedRaised != null) ? Number(c.gifted || c.giftedRaised) : null
                              const usedRaised = raisedGifted != null ? raisedGifted : raisedAll
                              const goal = Number(c.goal || 0) || null
                              const percent = goal ? Math.min(100, Math.round((usedRaised / goal) * 100)) : null
                                const isApproved = usedRaised > 0
                              return (
                                <div key={c.id} style={{padding:8, border:'1px solid rgba(255,255,255,0.03)', borderRadius:6, marginBottom:8}}>
                                  <div style={{display:'flex', justifyContent:'space-between'}}>
                                    <div>
                                        <div style={{display:'flex', alignItems:'center', gap:8}}>
                                          <div style={{fontWeight:700}}>{c.name}</div>
                                          {isApproved && <div style={{background:'var(--color-neon)', color:'#000', padding:'2px 8px', borderRadius:6, fontSize:12, fontWeight:700}}>Approved</div>}
                                        </div>
                                      <div style={{fontSize:12, color:'#bbb'}}>{c.goal?`Goal: $${c.goal}`:''}</div>
                                      {(c.gifted || c.giftedRaised != null) && (
                                        <div style={{fontSize:12, color:'#9be', marginTop:6}}>Raised (gifts): <strong style={{color:'var(--color-neon)'}}>${(c.gifted || c.giftedRaised || 0)}</strong></div>
                                      )}
                                      {percent != null && <div style={{fontSize:12, color:'#bbb'}}>Progress: <strong style={{color:'var(--color-neon)'}}>{percent}%</strong></div>}
                                    </div>
                                    <div style={{textAlign:'right'}}>
                                      <div style={{fontWeight:700}}>${usedRaised}</div>
                                      <div style={{fontSize:12, color:'#bbb'}}>{(percent != null && percent > 0) ? `${percent}%` : ''}</div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          <div style={{marginTop:8}}>
                            <div style={{color:'var(--color-neon)', fontWeight:700, marginBottom:8}}>Donor Analytics</div>
                            {(analyticsData.donorStats || []).map(d => (
                              <div key={d.id} style={{padding:8, border:'1px solid rgba(255,255,255,0.03)', borderRadius:6, marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <div>
                                  <div style={{fontWeight:700}}>{d.name}</div>
                                  <div style={{fontSize:12, color:'#bbb'}}>{d.email}</div>
                                </div>
                                <div style={{textAlign:'right'}}>
                                  <div style={{fontWeight:700}}>${(Number(d.totalGiving || 0)).toLocaleString ? (Number(d.totalGiving || 0)).toLocaleString() : (d.totalGiving || 0)}</div>
                                  <div style={{fontSize:12, color:'#bbb'}}>{d.gifts} gifts</div>
                                  <div style={{marginTop:6}}><button className="btn btn-ghost" onClick={async ()=>{
                                    try {
                                      const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
                                      const res = await fetch(`/api/donors/${d.id}`, { headers: { ...(token?{ Authorization:`Bearer ${token}` }:{} ) } })
                                      if (!res.ok) { const err = await res.json().catch(()=>({})); return alert('Unable to load donor: '+(err.error||'unknown')) }
                                      const payload = await res.json()
                                      setSelectedDonor({ ...payload.donor, donations: payload.donations })
                                    } catch (e) { console.warn(e); alert('Failed to fetch donor') }
                                  }}>View</button></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* History UI removed from dashboard and moved to Admin Settings */}

              {/* donors / campaigns quick summaries removed; use the dedicated pages for full lists */}

              {/* AI Decision Summary floating panel (draggable + minimizable) */}
              {aiResult && (
                <div
                  role="dialog"
                  aria-label="AI Decision Summary"
                  style={{
                    position: 'fixed',
                    zIndex: 9999,
                    width: aiMinimized ? 200 : 640,
                    height: aiMinimized ? 48 : 'auto',
                    left: aiPos.left != null ? aiPos.left : undefined,
                    top: aiPos.top != null ? aiPos.top : undefined,
                    right: aiPos.left == null ? 20 : undefined,
                    bottom: aiPos.top == null ? 20 : undefined,
                    background: 'var(--color-off-black)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    padding: aiMinimized ? '6px 8px' : 16,
                    borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
                  }}
                >
                  <div
                    onMouseDown={(e)=>{
                      // start drag
                      aiDragRef.current.dragging = true
                      aiDragRef.current.startX = e.clientX
                      aiDragRef.current.startY = e.clientY
                      const rect = e.currentTarget.parentElement.getBoundingClientRect()
                      aiDragRef.current.origLeft = rect.left
                      aiDragRef.current.origTop = rect.top
                      // prevent text selection
                      e.preventDefault()
                    }}
                    style={{display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'grab', overflow:'hidden'}}
                  >
                    <div style={{fontWeight:700, color:'var(--color-neon)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth: aiMinimized ? 140 : 'unset'}}>
                      AI Decision Summary
                    </div>
                    <div style={{display:'flex', gap:8, alignItems:'center'}}>
                      <button
                        className="btn"
                        onClick={(e)=>{ e.stopPropagation(); downloadAiResult() }}
                        disabled={aiLoading || !aiResult}
                        style={ aiMinimized ? { padding: '6px 8px', fontSize:12, minWidth:0 } : {} }
                      >{ aiMinimized ? 'JSON' : 'Download JSON' }</button>
                      <button
                        className="btn btn-ghost"
                        onClick={(e)=>{ e.stopPropagation(); setAiMinimized(m => !m) }}
                        style={ aiMinimized ? { padding: '6px 8px', fontSize:12, minWidth:0 } : {} }
                      >{aiMinimized ? 'Restore' : 'Minimize'}</button>
                      <button
                        className="btn btn-ghost"
                        onClick={(e)=>{ e.stopPropagation(); setAiResult(null) }}
                        style={ aiMinimized ? { padding: '6px 8px', fontSize:12, minWidth:0 } : {} }
                      >Close</button>
                    </div>
                  </div>

                  {!aiMinimized && (
                    <div style={{marginTop:8, maxHeight:'70vh', overflow:'auto', minWidth:420}}>
                      {aiResult.error ? (
                        <div style={{color:'#ff8080'}}>{aiResult.error}</div>
                      ) : (
                        <div style={{color:'#ddd', lineHeight:1.6}}>
                          {/* render parsed JSON-like summary if present */}
                          {aiDisplay?.parsed ? (
                            <div>
                              {Object.keys(aiDisplay.parsed).map((k) => (
                                <div key={k} style={{marginBottom:8}}>
                                  <div style={{fontWeight:700, color:'#bbb', marginBottom:6}}>{k}</div>
                                  <pre style={{whiteSpace:'pre-wrap', color:'#ccc', background:'transparent', padding:0, margin:0}}>{JSON.stringify(aiDisplay.parsed[k], null, 2)}</pre>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div>
                              {(aiDisplay?.paras || []).map((p,idx) => (
                                <p key={idx} style={{marginTop: idx===0 ? 0 : 12}}>{p}</p>
                              ))}
                            </div>
                          )}

                          {aiResult.insights && aiResult.insights.length > 0 && (
                            <div style={{marginTop:12}}>
                              <strong style={{color:'#bbb'}}>Insights</strong>
                              <ul style={{marginTop:8}}>{aiResult.insights.map((i,idx)=>(<li key={idx} style={{color:'#ccc'}}>{i}</li>))}</ul>
                            </div>
                          )}
                          {aiResult.concerns && aiResult.concerns.length > 0 && (
                            <div style={{marginTop:12}}>
                              <strong style={{color:'#bbb'}}>Concerns</strong>
                              <ul style={{marginTop:8}}>{aiResult.concerns.map((c,idx)=>(<li key={idx} style={{color:'#fcc'}}>{c}</li>))}</ul>
                            </div>
                          )}
                          {aiResult.actions && aiResult.actions.length > 0 && (
                            <div style={{marginTop:12}}>
                              <strong style={{color:'#bbb'}}>Suggested actions</strong>
                              <ul style={{marginTop:8}}>{aiResult.actions.map((a,idx)=>(<li key={idx} style={{color:'#ccc'}}>{a}</li>))}</ul>
                            </div>
                          )}
                          {(!aiResult.actions || aiResult.actions.length === 0) && !aiResult.error && (
                            <div style={{marginTop:12, color:'#999'}}>
                              No suggested actions found. To receive actionable recommendations, ensure the server has an AI key set (OPENAI_API_KEY) or try re-running the summary with additional context.
                            </div>
                          )}
                          {/* Chat follow-up UI */}
                          <div style={{marginTop:14, borderTop:'1px solid rgba(255,255,255,0.02)', paddingTop:12}}>
                            <div style={{fontSize:13, color:'#bbb', marginBottom:8}}>Ask follow-up questions</div>
                            <div style={{display:'flex', flexDirection:'column', gap:8}}>
                              <div style={{maxHeight:180, overflow:'auto', padding:10, background:'#070707', borderRadius:8}}>
                                {aiChatMessages.length === 0 && !aiQuestionLoading ? (
                                  <div style={{color:'#8a8a8a', fontSize:13}}>Ask a question about this summary and the assistant will respond.</div>
                                ) : (
                                  <div>
                                    {aiChatMessages.map((m, idx) => (
                                      <div key={idx} style={{marginBottom:10}}>
                                        <div style={{fontSize:12, color:'#999', marginBottom:4}}>{m.role === 'user' ? 'You' : 'Assistant'}</div>
                                        <div style={{color: m.role === 'user' ? '#fff' : '#cfe', fontSize:14, lineHeight:1.5, whiteSpace:'pre-wrap', wordBreak:'break-word'}}>{m.text}</div>
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
                              <div style={{display:'flex', gap:8}}>
                                <input className="input" value={aiQuestion} onChange={e=>setAiQuestion(e.target.value)} placeholder="Ask a follow-up question..." />
                                <button className={"btn" + (aiQuestionLoading ? ' loading' : '')} onClick={async ()=>{
                                  const q = (aiQuestion||'').trim()
                                  if (!q) return
                                  // append user message
                                  setAiChatMessages(m => [...m, { role: 'user', text: q }])
                                  setAiQuestion('')
                                  setAiQuestionLoading(true)
                                  try {
                                    const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
                                    const res = await fetch('/api/admin/ai-question', { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{} ) }, body: JSON.stringify({ question: q, context: aiResult }) })
                                    const data = await res.json().catch(()=>null)
                                    if (!res.ok) {
                                      setAiChatMessages(m => [...m, { role: 'assistant', text: 'Error: ' + (data?.error || 'Request failed') }])
                                    } else {
                                      setAiChatMessages(m => [...m, { role: 'assistant', text: data.answer || '[No answer]' }])
                                    }
                                  } catch (err) {
                                    setAiChatMessages(m => [...m, { role: 'assistant', text: 'Error: ' + String(err) }])
                                  } finally {
                                    setAiQuestionLoading(false)
                                  }
                                }} disabled={aiQuestionLoading || !aiResult}>{aiQuestionLoading ? (<><span className="spinner" style={{marginRight:8}}></span>Thinking…</>) : 'Send'}</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {aiConfirmOpen && (
                <div className="dialog-backdrop">
                  <div style={{width:520, background:'var(--color-off-black)', border:'1px solid rgba(255,255,255,0.04)', padding:18, borderRadius:8}}>
                    <h3 style={{color:'var(--color-neon)'}}>Generate AI Decision Summary</h3>
                    <p style={{color:'#ddd'}}>AI outputs are advisory and may be incorrect. This action may send data to an external AI provider.</p>
                    <label style={{display:'flex', alignItems:'center', gap:8, marginTop:8}}>
                      <input type="checkbox" checked={aiConfirmAgree} onChange={e=>setAiConfirmAgree(e.target.checked)} />
                      <span style={{color:'#bbb'}}>I understand AI outputs are advisory and may be inaccurate.</span>
                    </label>
                    <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:12}}>
                      <button className="btn btn-ghost" onClick={()=>{ setAiConfirmOpen(false); setAiConfirmAgree(false) }}>Cancel</button>
                      <button className="btn" onClick={async ()=>{ setAiConfirmLoading(true); try { await fetchDecisionSummary(); setAiConfirmOpen(false); setAiConfirmAgree(false); } catch (e) { alert('Failed to generate: '+String(e)) } finally { setAiConfirmLoading(false) } }} disabled={!aiConfirmAgree || aiConfirmLoading}>{aiConfirmLoading? 'Generating…' : 'Generate'}</button>
                    </div>
                  </div>
                </div>
              )}

              {confirmOpen && (
                <div className="dialog-backdrop">
                  <div style={{width:420, background:'var(--color-off-black)', border:'1px solid rgba(255,255,255,0.04)', padding:18, borderRadius:8}}>
                    <h3 style={{color:'var(--color-neon)'}}>Confirm Clear All Data</h3>
                    <p style={{color:'#ddd'}}>This will permanently delete donors, donations, campaigns and alerts from the database. This cannot be undone.</p>
                    <p style={{color:'#ffb3b3', fontWeight:700}}>Type your admin password to confirm.</p>
                    <div style={{marginTop:8}}>
                      <input className="input" type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Admin password" autoComplete="current-password" />
                    </div>
                    {confirmError && <div style={{color:'#ff8080', marginTop:8}}>{confirmError}</div>}
                    <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:12}}>
                      <button className="btn btn-ghost" onClick={()=>{ setConfirmOpen(false); setConfirmPassword(''); setConfirmError(null) }}>Cancel</button>
                      <button className="btn" onClick={async ()=>{
                        setConfirmLoading(true); setConfirmError(null);
                        try{
                          const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
                          const res = await fetch('/api/clear', { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{} ) }, body: JSON.stringify({ password: confirmPassword }) })
                          const data = await res.json()
                          if (!res.ok) throw new Error(data?.error || 'Clear failed')
                          setMetrics([]); setPartners([]); setDonors([]); setCampaigns([]); setRecentActivity([]); setAlerts([]); setAnalytics(null)
                          setConfirmOpen(false); setConfirmPassword('')
                        } catch(err) {
                          setConfirmError(err.message)
                        } finally { setConfirmLoading(false) }
                      }} style={{background:'#ff4d4d', color:'#fff'}} disabled={confirmLoading}>{confirmLoading? 'Clearing...' : 'Confirm Clear'}</button>
                    </div>
                  </div>
                </div>
              )}

              {seedModalOpen && (
                <div className="dialog-backdrop">
                  <div style={{width:720, maxHeight: '70vh', overflow:'auto', background:'var(--color-off-black)', border:'1px solid rgba(255,255,255,0.04)', padding:18, borderRadius:8}}>
                    <h3 style={{color:'var(--color-neon)'}}>Seeder Response</h3>
                    <div style={{fontSize:13, color:'#bbb', marginBottom:8}}>Full response from <code>/api/seed</code></div>
                    <div style={{background:'#080808', padding:12, borderRadius:6, color:'#ddd', maxHeight:380, overflow:'auto'}}>
                      <pre style={{whiteSpace:'pre-wrap', wordBreak:'break-word', color:'#ddd'}}>{JSON.stringify(seedResponseData, null, 2)}</pre>
                    </div>
                    {seedError && <div style={{color:'#ff8080', marginTop:8}}>{seedError}</div>}
                    <div style={{display:'flex', justifyContent:'flex-end', marginTop:12}}>
                      <button className="btn btn-ghost" onClick={()=>{ setSeedModalOpen(false); setSeedResponseData(null); setSeedError(null) }}>Close</button>
                    </div>
                  </div>
                </div>
              )}

              {campaignActionModalOpen && (
                <div className="dialog-backdrop">
                  <div style={{width:520, background:'var(--color-off-black)', border:'1px solid rgba(255,255,255,0.04)', padding:18, borderRadius:8}}>
                    <h3 style={{color:'var(--color-neon)'}}>{campaignActionType === 'approve' ? 'Approve Campaign' : (campaignActionType === 'deactivate' ? 'Deactivate Campaign' : 'Campaign Action')}</h3>
                    <div style={{color:'#bbb', marginTop:6}}>{campaignActionCampaign?.name}</div>
                    <p style={{color:'#ddd', marginTop:8}}>To confirm this action, enter your admin password.</p>
                    <div style={{marginTop:8}}>
                      <input className="input" type="password" value={campaignActionPassword} onChange={e=>setCampaignActionPassword(e.target.value)} placeholder="Admin password" autoComplete="current-password" />
                    </div>
                    {campaignActionError && <div style={{color:'#ff8080', marginTop:8}}>{campaignActionError}</div>}
                    <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:12}}>
                      <button className="btn btn-ghost" onClick={()=>{ setCampaignActionModalOpen(false); setCampaignActionCampaign(null); setCampaignActionPassword(''); setCampaignActionError(null) }}>Cancel</button>
                      <button className="btn" onClick={async ()=>{
                        if (!campaignActionCampaign || !campaignActionType) return
                        setCampaignActionLoading(true); setCampaignActionError(null)
                        try {
                          const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
                          const body = { password: campaignActionPassword }
                          if (campaignActionType === 'approve') body.action = 'approve'
                          else if (campaignActionType === 'deactivate') body.action = 'deactivate'
                          else if (campaignActionType === 'deny') body.approved = false
                          const res = await fetch(`/api/campaigns/${campaignActionCampaign.id}/approve`, { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{} ) }, body: JSON.stringify(body) })
                          const data = await res.json().catch(()=>null)
                          if (!res.ok) {
                            const msg = data?.error || 'Action failed'
                            setCampaignActionError(msg + (data?.details ? ` — ${data.details}` : ''))
                            return
                          }
                          // refresh admin datasets
                          try { await Promise.all([loadCampaigns().catch(()=>{}), loadAnalytics().catch(()=>{})]) } catch (e) { console.warn('Reload after campaign action failed', e) }
                          setCampaignActionModalOpen(false)
                          setCampaignActionCampaign(null)
                          setCampaignActionPassword('')
                        } catch (err) {
                          console.warn('Campaign action failed', err)
                          setCampaignActionError(String(err))
                        } finally {
                          setCampaignActionLoading(false)
                        }
                      }} disabled={campaignActionLoading || !campaignActionPassword}>{campaignActionLoading? 'Working...' : 'Confirm'}</button>
                    </div>
                  </div>
                </div>
              )}

              {roleChangeModalOpen && (
                <div className="dialog-backdrop">
                  <div style={{width:520, background:'var(--color-off-black)', border:'1px solid rgba(255,255,255,0.04)', padding:18, borderRadius:8}}>
                    <h3 style={{color:'var(--color-neon)'}}>{roleChangeTargetRole === 'ADMIN' ? 'Promote to Admin' : 'Change Role'}</h3>
                    <div style={{color:'#bbb', marginTop:6}}>{roleChangeTargetUser ? (roleChangeTargetUser.name || roleChangeTargetUser.email) : ''}</div>
                    <p style={{color:'#ddd', marginTop:8}}>Changing a user's role is a privileged action. To confirm, enter your admin password.</p>
                    <div style={{marginTop:8}}>
                      <input className="input" type="password" value={roleChangePassword} onChange={e=>setRoleChangePassword(e.target.value)} placeholder="Admin password" autoComplete="current-password" />
                    </div>
                    {roleChangeError && <div style={{color:'#ff8080', marginTop:8}}>{roleChangeError}</div>}
                    <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:12}}>
                      <button className="btn btn-ghost" onClick={()=>{ setRoleChangeModalOpen(false); setRoleChangeTargetUser(null); setRoleChangeTargetRole(null); setRoleChangePassword(''); setRoleChangeError(null) }}>Cancel</button>
                      <button className="btn" onClick={async ()=>{
                        if (!roleChangeTargetUser || !roleChangeTargetRole) return
                        setRoleChangeLoading(true); setRoleChangeError(null)
                        try {
                          const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
                          const res = await fetch(`/api/users/${roleChangeTargetUser.id}/role`, { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{} ) }, body: JSON.stringify({ role: roleChangeTargetRole, password: roleChangePassword }) })
                          const data = await res.json().catch(()=>null)
                          if (!res.ok) {
                            const msg = data?.error || 'Role change failed'
                            setRoleChangeError(msg + (data?.details ? ` — ${data.details}` : ''))
                            return
                          }
                          try { await loadUsers(); } catch (e) { console.warn('Reload users failed', e) }
                          setRoleChangeModalOpen(false)
                          setRoleChangeTargetUser(null)
                          setRoleChangeTargetRole(null)
                          setRoleChangePassword('')
                        } catch (err) {
                          console.warn('Role change failed', err)
                          setRoleChangeError(String(err))
                        } finally { setRoleChangeLoading(false) }
                      }} disabled={roleChangeLoading || !roleChangePassword}>{roleChangeLoading? 'Working...' : 'Confirm'}</button>
                    </div>
                  </div>
                </div>
              )}

              {manualDeleteModalOpen && (
                <div className="dialog-backdrop">
                  <div style={{width:520, background:'var(--color-off-black)', border:'1px solid rgba(255,255,255,0.04)', padding:18, borderRadius:8}}>
                    <h3 style={{color:'var(--color-neon)'}}>Delete Campaign</h3>
                    <div style={{color:'#bbb', marginTop:6}}>{manualDeleteCampaign?.name || manualDeleteCampaign?.title}</div>
                    <p style={{color:'#ddd', marginTop:8}}>This will permanently delete the campaign and its donations. To confirm, enter your admin password.</p>
                    <div style={{marginTop:8}}>
                      <input className="input" type="password" value={manualDeletePassword} onChange={e=>setManualDeletePassword(e.target.value)} placeholder="Admin password" autoComplete="current-password" />
                    </div>
                    {manualDeleteError && <div style={{color:'#ff8080', marginTop:8}}>{manualDeleteError}</div>}
                    <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:12}}>
                      <button className="btn btn-ghost" onClick={()=>{ setManualDeleteModalOpen(false); setManualDeleteCampaign(null); setManualDeletePassword(''); setManualDeleteError(null) }}>Cancel</button>
                      <button className="btn btn-danger" onClick={async ()=>{
                        if (!manualDeleteCampaign) return
                        setManualDeleteLoading(true); setManualDeleteError(null)
                        try {
                          const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
                          const res = await fetch('/api/admin/delete-campaign', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{} ) }, body: JSON.stringify({ password: manualDeletePassword, id: manualDeleteCampaign.id }) })
                          const data = await res.json().catch(()=>null)
                          if (!res.ok) {
                            setManualDeleteError(data?.error || 'Delete failed')
                            return
                          }
                          try { await Promise.all([loadCampaigns().catch(()=>{}), loadAnalytics().catch(()=>{})]) } catch(e){console.warn('Reload after delete failed', e)}
                          setManualDeleteModalOpen(false)
                          setManualDeleteCampaign(null)
                          setManualDeletePassword('')
                        } catch (err) {
                          console.warn('Manual delete failed', err)
                          setManualDeleteError(String(err))
                        } finally { setManualDeleteLoading(false) }
                      }} disabled={manualDeleteLoading || !manualDeletePassword}>{manualDeleteLoading? 'Deleting...' : 'Delete'}</button>
                    </div>
                  </div>
                </div>
              )}

              {selectedDonor && (
                <div className="dialog-backdrop">
                  <div style={{width:520, background:'var(--color-off-black)', border:'1px solid rgba(255,255,255,0.04)', padding:18, borderRadius:8}}>
                    <h3 style={{color:'var(--color-neon)'}}>{selectedDonor.name}</h3>
                    <div style={{color:'#bbb', marginTop:6}}>{selectedDonor.email}</div>
                    <div style={{display:'flex', gap:12, marginTop:12}}>
                      <div style={{flex:1, padding:12, border:'1px solid rgba(255,255,255,0.03)', borderRadius:6}}>
                        <div style={{fontSize:12, color:'#bbb'}}>Total Giving</div>
                        <div style={{fontWeight:700, fontSize:18}}>${selectedDonor.totalGiving}</div>
                      </div>
                      <div style={{flex:1, padding:12, border:'1px solid rgba(255,255,255,0.03)', borderRadius:6}}>
                        <div style={{fontSize:12, color:'#bbb'}}>Gifts</div>
                        <div style={{fontWeight:700, fontSize:18}}>{selectedDonor.gifts}</div>
                      </div>
                    </div>
                    {selectedDonor.donations && selectedDonor.donations.length > 0 && (
                      <div style={{marginTop:12}}>
                        <div style={{fontWeight:700, color:'var(--color-neon)', marginBottom:8}}>Donation History</div>
                        <div style={{display:'flex', flexDirection:'column', gap:8}}>
                          {selectedDonor.donations.map(d => (
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
                    )}
                    <div style={{display:'flex', justifyContent:'flex-end', marginTop:12}}>
                      <button className="btn btn-ghost" onClick={()=>setSelectedDonor(null)}>Close</button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )
        }
