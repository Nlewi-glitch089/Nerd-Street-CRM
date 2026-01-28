import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'

export default function AdminSettings() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  // settings state (simple, stored to localStorage for demo)
  const [orgName, setOrgName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [enableEmails, setEnableEmails] = useState(true)
  const [allowGuestAccess, setAllowGuestAccess] = useState(false)
  const [enableDebug, setEnableDebug] = useState(false)

  // developer info unlock
  const [devLocked, setDevLocked] = useState(true)
  const [devPassword, setDevPassword] = useState('')
  const [devError, setDevError] = useState(null)
  const [devTab, setDevTab] = useState('rubric') // 'rubric' | 'reflections'
  const [saveMessage, setSaveMessage] = useState('')
  const [actionLogs, setActionLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const saveTimerRef = useRef(null)
  const firstSaveRef = useRef(true)

  // format timestamps into readable string + relative time
  function formatWhen(iso) {
    try {
      const d = new Date(iso)
      const now = Date.now()
      const diff = Math.round((now - d.getTime()) / 1000) // seconds
      if (diff < 60) return `${d.toLocaleString()} (${diff}s ago)`
      if (diff < 3600) return `${d.toLocaleString()} (${Math.round(diff/60)}m ago)`
      if (diff < 86400) return `${d.toLocaleString()} (${Math.round(diff/3600)}h ago)`
      return `${d.toLocaleString()} (${Math.round(diff/86400)}d ago)`
    } catch (e) { return String(iso) }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
        if (!token) {
          router.replace('/signin')
          return
        }
        const res = await fetch('/api/protected', { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) {
          try { localStorage.removeItem('token') } catch (e) {}
          router.replace('/signin')
          return
        }
        const data = await res.json()
        if (!mounted) return
        setUser(data.user || null)
        if (data?.user?.role !== 'ADMIN') {
          router.replace('/signin')
          return
        }
        // load saved settings (demo persistence)
        try {
          const s = JSON.parse(localStorage.getItem('nscrm_settings') || '{}')
          setOrgName(s.orgName || 'Nerd Street Org')
          setAdminEmail(s.adminEmail || (data.user ? data.user.email : ''))
          setEnableEmails(typeof s.enableEmails === 'boolean' ? s.enableEmails : true)
          setAllowGuestAccess(!!s.allowGuestAccess)
          setEnableDebug(!!s.enableDebug)
        } catch (e) {}
      } catch (err) {
        router.replace('/signin')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  function saveSettings() {
    const s = { orgName, adminEmail, enableEmails, allowGuestAccess, enableDebug }
    try { localStorage.setItem('nscrm_settings', JSON.stringify(s)) } catch (e) {}
    // transient inline confirmation instead of alert
    setSaveMessage('Settings saved')
    try { clearTimeout(saveTimerRef.current) } catch (e) {}
    saveTimerRef.current = setTimeout(() => setSaveMessage(''), 2200)
  }

  // autosave on changes (debounced) - skip the very first run to avoid showing
  // a "Settings saved" message immediately after loading existing values.
  useEffect(() => {
    try { clearTimeout(saveTimerRef.current) } catch (e) {}
    if (firstSaveRef.current) {
      // skip the first autosave invocation caused by initial state population
      firstSaveRef.current = false
      return
    }
    saveTimerRef.current = setTimeout(() => {
      saveSettings()
    }, 900)
    return () => { try { clearTimeout(saveTimerRef.current) } catch (e) {} }
  }, [orgName, adminEmail, enableEmails, allowGuestAccess, enableDebug])

  async function unlockDeveloper() {
    setDevError(null)
    // verify password by attempting login for the current user, but preserve existing token
    try {
      const oldToken = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
      const res = await fetch('/api/auth/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email: user.email, password: devPassword }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Invalid password')
      // restore old token so session is unchanged
      try { if (oldToken) localStorage.setItem('token', oldToken) } catch (e) {}
      setDevLocked(false)
      setDevPassword('')
    } catch (err) {
      setDevError(err.message || 'Unlock failed')
    }
  }

  if (loading) return <div style={{padding:24}}>Loading…</div>

  return (
    <main style={{padding:20, maxWidth:900, margin:'0 auto'}}>
      <h2 style={{marginTop:0}}>Admin Settings</h2>
      <p style={{color:'#aaa'}}>Organization settings and minimal system toggles.</p>

      <div style={{marginTop:10, marginBottom:6}}>
        <button className="btn btn-ghost" onClick={()=>router.push('/admin')} title="Back to dashboard">Back to dashboard</button>
      </div>

      <section className="card" style={{marginTop:12}}>
        <div style={{display:'grid', gap:12}}>
          <label style={{fontSize:13}}>Organization name</label>
          <input className="input" value={orgName} onChange={(e)=>setOrgName(e.target.value)} />

          <label style={{fontSize:13}}>Admin contact email</label>
          <input className="input" value={adminEmail} onChange={(e)=>setAdminEmail(e.target.value)} />

          <div style={{display:'flex', gap:12, alignItems:'center'}}>
            <label style={{display:'flex', alignItems:'center', gap:8}}><input type="checkbox" checked={enableEmails} onChange={e=>setEnableEmails(e.target.checked)} /> Enable email notifications</label>
            <label style={{display:'flex', alignItems:'center', gap:8}}><input type="checkbox" checked={allowGuestAccess} onChange={e=>setAllowGuestAccess(e.target.checked)} /> Allow guest access</label>
            <label style={{display:'flex', alignItems:'center', gap:8}}><input type="checkbox" checked={enableDebug} onChange={e=>setEnableDebug(e.target.checked)} /> Enable debug tools</label>
          </div>

          <div style={{display:'flex', gap:8, marginTop:8, alignItems:'center'}}>
            <button className="btn btn-primary" onClick={saveSettings}>Save</button>
            <button className="btn btn-ghost" onClick={()=>{
              try { localStorage.removeItem('nscrm_settings') } catch(e) {}
              setOrgName(''); setAdminEmail(''); setEnableEmails(true); setAllowGuestAccess(false); setEnableDebug(false)
            }}>Reset</button>
            {saveMessage && <div style={{marginLeft:8, color:'var(--color-neon)', fontWeight:700, textShadow:'0 0 8px rgba(47,255,85,0.18)'}}>{saveMessage}</div>}
          </div>
        </div>
      </section>

      <section style={{marginTop:20}}>
        <h3>Audit Log</h3>
        <p style={{color:'#999', marginTop:0}}>View recent admin actions and changes. This is moved from the dashboard to settings for clarity.</p>
        <div className="card" style={{marginTop:8}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{fontWeight:700}}>Recent Admin Changes</div>
            <div style={{display:'flex', gap:8}}>
              <button className="btn" onClick={async ()=>{
                setLogsLoading(true)
                try {
                  const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
                  const res = await fetch('/api/admin/action-log', { headers: { ...(token?{ Authorization:`Bearer ${token}` }:{} ) } })
                  if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.error || 'Failed to load') }
                  const data = await res.json().catch(()=>({}))
                  setActionLogs(data.logs || [])
                } catch (e) {
                  console.warn('Load logs failed', e)
                } finally { setLogsLoading(false) }
              }} disabled={logsLoading}>{logsLoading ? 'Loading…' : 'Refresh'}</button>
            </div>
          </div>
          <div style={{marginTop:8, maxHeight:260, overflow:'auto'}}>
            {actionLogs.length === 0 ? (
              <div style={{color:'#888'}}>No recent changes. Click Refresh to load.</div>
            ) : (
              actionLogs.map(l => {
                const when = formatWhen(l.createdAt)
                const actor = l.actorName || (l.user ? (l.user.name || l.user.email || l.user.id) : 'system')
                const verbMap = { create: 'created', update: 'updated', delete: 'deleted', approve: 'approved', deactivate: 'deactivated', deny: 'denied' }
                const verb = verbMap[l.action] || l.action
                // prefer an enriched `targetName` from the API, then meta.name/title, then id
                const friendlyMetaName = (l.meta && (l.meta.name || l.meta.title))
                const friendlyTarget = l.targetName || friendlyMetaName || (l.meta && l.meta.deletedAt ? `${l.targetId} (deleted ${new Date(l.meta.deletedAt).toLocaleString()})` : l.targetId)
                const headline = `${actor} ${verb} ${String(l.targetType).toLowerCase()} ${friendlyTarget}`
                return (
                  <details key={l.id} style={{padding:8, borderBottom:'1px solid rgba(255,255,255,0.02)'}}>
                    <summary style={{fontSize:13, color:'#ddd', cursor:'pointer'}}>{headline}</summary>
                    <div style={{marginTop:8, color:'#bbb', display:'flex', justifyContent:'space-between', gap:8}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13}}><strong>Action:</strong> {l.action}</div>
                        <div style={{fontSize:13}}><strong>Target:</strong> {l.targetType} - {l.targetId}</div>
                        {l.meta && <div style={{marginTop:6}}><strong>Meta:</strong> <pre style={{whiteSpace:'pre-wrap', margin:0, color:'#ccc'}}>{JSON.stringify(l.meta, null, 2)}</pre></div>}
                      </div>
                      <div style={{minWidth:140, textAlign:'right'}}>
                        <div style={{fontSize:12, color:'#bbb'}}><strong>By:</strong> {actor}</div>
                        <div style={{fontSize:12, color:'#777', marginTop:6}}>{when}</div>
                      </div>
                    </div>
                  </details>
                )
              })
            )}
          </div>
        </div>

        <h3>Developer Information</h3>
        <p style={{color:'#999', marginTop:0}}>Hidden by default - re-enter your admin password to unlock read-only developer notes.</p>

        {devLocked ? (
          <div style={{marginTop:12, display:'flex', gap:8, alignItems:'center'}}>
            <input className="input" type="password" placeholder="Enter admin password to unlock" value={devPassword} onChange={e=>setDevPassword(e.target.value)} />
            <button className="btn btn-primary" onClick={unlockDeveloper}>Unlock</button>
            {devError && <div style={{color:'#ff8080', marginLeft:8}}>{devError}</div>}
          </div>
        ) : (
          <div className="card" style={{marginTop:12}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:12}}>
              <div>
                <h4 style={{margin:0}}>Developer Information</h4>
                <p style={{color:'#ddd', margin:'6px 0 0 0'}}>Developer: Nakerra Lewis - software developer focused on UX-driven, production-minded tools for nonprofits and small teams.</p>
              </div>
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <button className="btn btn-ghost" onClick={()=>setDevLocked(true)}>Lock</button>
              </div>
            </div>

            <div style={{marginTop:12, borderTop:'1px solid rgba(255,255,255,0.04)', paddingTop:12}}>
              <div style={{display:'flex', gap:8}}>
                <button className={`btn ${devTab==='rubric' ? 'btn-primary' : 'btn-ghost'}`} onClick={()=>setDevTab('rubric')}>System Evaluation Rubric</button>
                <button className={`btn ${devTab==='reflections' ? 'btn-primary' : 'btn-ghost'}`} onClick={()=>setDevTab('reflections')}>Developer Reflections</button>
                <button className={`btn ${devTab==='aiPolicy' ? 'btn-primary' : 'btn-ghost'}`} onClick={()=>setDevTab('aiPolicy')}>AI Policy</button>
              </div>

              <div style={{marginTop:12}}>
                {devTab === 'rubric' ? (
                  <div style={{color:'#ddd', lineHeight:1.5}}>
                    <h4 style={{marginTop:0}}>System Evaluation Rubric</h4>
                    <p>This rubric defines how the system is evaluated for correctness, usability, and production readiness. Each criterion is assessed based on observable behavior rather than intent.</p>

                    <h5>1. Data accuracy and consistency</h5>
                    <ul>
                      <li>Donor profiles, activity logs, and related records remain consistent across views and updates.</li>
                      <li>Create, update, and delete actions result in immediate, predictable state changes.</li>
                      <li>No silent failures, partial writes, or ambiguous data states.</li>
                      <li>Validation errors are explicit and prevent invalid data from persisting.</li>
                    </ul>

                    <h5>2. Access control and admin safety</h5>
                    <ul>
                      <li>Admin-only actions are clearly scoped and inaccessible to non-admin users.</li>
                      <li>Sensitive settings and developer-facing information are gated and not discoverable by default.</li>
                      <li>Permission boundaries are enforced at both the UI and logic level.</li>
                      <li>Admin actions result in traceable, intentional outcomes.</li>
                    </ul>

                    <h5>3. System reliability and failure handling</h5>
                    <ul>
                      <li>Core system functions remain usable under expected load.</li>
                      <li>API and database failures are handled gracefully with user-facing feedback.</li>
                      <li>Error states favor recovery and clarity over silent degradation.</li>
                      <li>The system avoids cascading failures from single-point errors.</li>
                    </ul>

                    <h5>4. Interface clarity and decision support</h5>
                    <ul>
                      <li>Administrative actions are labeled by outcome, not implementation.</li>
                      <li>Settings are grouped by intent, reducing misconfiguration risk.</li>
                      <li>The interface allows admins to understand the impact of a change before committing it.</li>
                      <li>No action requires prior system knowledge to interpret correctly.</li>
                    </ul>

                    <h5>5. AI-assisted insight quality</h5>
                    <ul>
                      <li>AI features summarize and surface patterns relevant to planning and review.</li>
                      <li>Outputs are consistent, explainable, and non-authoritative.</li>
                      <li>AI never performs irreversible actions on behalf of the user.</li>
                      <li>Human oversight is preserved for all decision-making workflows.</li>
                    </ul>

                    <h4 style={{marginTop:12}}>Evidence / Rubric Page</h4>
                    <p style={{color:'#ccc'}}>Purpose: Enable instructors to assess implementation quality with direct, verifiable evidence.</p>
                    <h5>CCC.1.3 Evidence (Application Design & Implementation)</h5>
                    <ul className="evidence-list">
                      <li>Core system functionality implemented with real data structures</li>
                      <li>Admin-gated access to restricted developer and evaluation content</li>
                      <li>UI supports predictable, state-driven interactions</li>
                    </ul>

                    <h5>TS.6.2 Evidence (Technical Skills & System Architecture)</h5>
                    <ul className="evidence-list">
                      <li>Source code repository: <a href="https://github.com/Nlewi-glitch089/Nerd-Street-CRM" target="_blank" rel="noreferrer" style={{color:'var(--color-neon)'}}>GitHub</a></li>
                      <li>Clear separation of concerns between UI, logic, and data handling</li>
                      <li>Role-based access patterns enforced consistently</li>
                      <li>Error handling implemented across API and UI layers</li>
                    </ul>

                    <h5>TS.6.3 Evidence (Professional Practice & Project Management)</h5>
                    <ul className="evidence-list">
                      <li>Project planning and task tracking: <a href="https://trello.com/b/C2DiVfmd/crm-nerd-street" target="_blank" rel="noreferrer" style={{color:'var(--color-neon)'}}>Trello</a></li>
                      <li>Wireframes and system planning artifacts: <a href="https://www.figma.com/design/MyRhbMZ4A0ZB4iCukNSKif/CRM?node-id=0-1&p=f&t=zc4BwznDhUL3WAzq-0" target="_blank" rel="noreferrer" style={{color:'var(--color-neon)'}}>Figma</a></li>
                      <li>Iterative development with documented design decisions</li>
                    </ul>

                    <h5>Direct Links</h5>
                    <ul className="evidence-list">
                      <li><a href="https://github.com/Nlewi-glitch089/Nerd-Street-CRM" target="_blank" rel="noreferrer" style={{color:'var(--color-neon)'}}>GitHub Repository</a></li>
                      <li><a href="https://trello.com/b/C2DiVfmd/crm-nerd-street" target="_blank" rel="noreferrer" style={{color:'var(--color-neon)'}}>Project Board (Trello)</a></li>
                      <li><a href="https://www.figma.com/design/MyRhbMZ4A0ZB4iCukNSKif/CRM?node-id=0-1&p=f&t=zc4BwznDhUL3WAzq-0" target="_blank" rel="noreferrer" style={{color:'var(--color-neon)'}}>Wireframes / Figma</a></li>
                    </ul>
                  </div>
                ) : devTab === 'reflections' ? (
                  <div style={{color:'#ddd', lineHeight:1.6}}>
                    <h4 style={{marginTop:0}}>Developer Reflections</h4>
                    <h5>What challenged me the most</h5>
                    <p>The most significant challenge was balancing system capability with clarity. It was tempting to add more features or abstractions, but doing so would have increased cognitive load and reduced inspectability. Designing admin interfaces that are both powerful and safe required careful scoping - especially around access control, error handling, and AI-assisted features.</p>

                    <p>Another challenge was ensuring that AI outputs supported planning without becoming authoritative. This required deliberate constraints on where and how AI was used.</p>

                    <h5>What I would change or add with more time</h5>
                    <p>With additional time, I would:</p>
                    <ul className="evidence-list">
                      <li>Expand audit logging for admin actions to improve traceability</li>
                      <li>Add configurable role tiers beyond a single admin boundary</li>
                      <li>Introduce more granular AI summaries (time-based or campaign-based)</li>
                      <li>Conduct structured usability testing with nonprofit staff to validate assumptions</li>
                    </ul>

                    <h5>What I learned about building real products</h5>
                    <p>This project reinforced that clarity scales better than complexity. Systems that are easier to understand are easier to maintain, secure, and extend. Designing for real users—especially non-technical ones—requires prioritizing mental models over internal logic.</p>

                    <h5>How AI helped (and where it didn’t)</h5>
                    <p>AI was most effective when used for summarizing donor activity and trends, supporting planning and review workflows, and reducing manual analysis effort.</p>
                    <p>AI was intentionally not used for automated decision-making, data mutation or irreversible actions, or replacing human judgment. This reinforced the importance of treating AI as an assistive layer rather than a control mechanism.</p>
                  </div>
                ) : devTab === 'aiPolicy' ? (
                  <div style={{color:'#ddd', lineHeight:1.5}}>
                    <h4 style={{marginTop:0}}>AI Policy & Safeguards</h4>

                    <div style={{marginTop:8}}>
                      <h5 style={{marginBottom:6}}>Model and API</h5>
                      <p style={{marginTop:0, color:'#d0d0d0'}}>This project uses an external language model via a server-side API route. In production, we recommend using a provably responsible provider (such as OpenAI or similar) with scoped API keys and audit logging enabled. All API calls are logged for transparency and continuous improvement.</p>

                      <h5 style={{marginTop:12, marginBottom:6}}>Prompt Design</h5>
                      <p style={{marginTop:0, color:'#d0d0d0'}}>Prompts are designed to avoid sending raw PII. The AI receives aggregated or anonymized donor activity (counts, recency, and engagement signals) and is explicitly asked to return prioritized, actionable suggestions rather than exact donor text or sensitive data.</p>

                      <div style={{marginTop:10, background:'rgba(0,0,0,0.12)', padding:10, borderRadius:6, border:'1px solid rgba(var(--color-neon-rgb),0.04)'}}>
                        <code style={{color:'#bfbfbf'}}>Example: "Count: 5 dormant donors, Avg days since gift: 487" → Actionable suggestions</code>
                      </div>

                      <h5 style={{marginTop:12, marginBottom:6}}>How AI Improves Decision-Making</h5>
                      <p style={{marginTop:0, color:'#d0d0d0'}}>AI helps identify donor risk, highlight trends, and propose next steps - enabling small teams to make data-driven decisions faster without requiring deep analytics expertise.</p>
                      <div style={{marginTop:10, display:'grid', gap:8}}>
                        <div style={{border:'1px solid rgba(var(--color-neon-rgb),0.06)', padding:8, borderRadius:6}}><strong style={{color:'var(--color-neon)'}}>Risk Identification</strong> - flags dormant donors (6+ months)</div>
                        <div style={{border:'1px solid rgba(var(--color-neon-rgb),0.06)', padding:8, borderRadius:6}}><strong style={{color:'var(--color-neon)'}}>Trend Analysis</strong> - identifies seasonal patterns</div>
                        <div style={{border:'1px solid rgba(var(--color-neon-rgb),0.06)', padding:8, borderRadius:6}}><strong style={{color:'var(--color-neon)'}}>Action Planning</strong> - suggests outreach cadence</div>
                      </div>

                      <h5 style={{marginTop:12, marginBottom:6}}>Responsible AI Usage</h5>
                      <ul style={{marginTop:8, color:'#d0d0d0'}}>
                        <li>AI outputs are advisory - human review is required before any donor outreach.</li>
                        <li>Do not send full PII to the model - donor data is anonymized or aggregated before processing.</li>
                        <li>Log all model inputs and outputs for an audit trail and continuous improvement.</li>
                        <li>Admin override is always available - admins can reject, modify, or approve any suggestion before action.</li>
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
