import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const router = useRouter()
  // redirect signed-in users to admin dashboard
  useEffect(() => {
    const check = async () => {
      try {
        const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
        if (!token) return
        const res = await fetch('/api/protected', { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          if (data && data.user) router.replace('/admin')
        }
      } catch (e) { /* ignore */ }
    }
    check()
  }, [])
  const [loadingLearn, setLoadingLearn] = useState(false)
  const learnStartRef = useRef(0)
  const MIN_LOAD_MS = 1500

  function handleLearn(e) {
    e && e.preventDefault()
    // trigger header loader for consistent UX if available
    if (typeof window !== 'undefined' && window.startHomeLoading) window.startHomeLoading()
    learnStartRef.current = Date.now()
    setLoadingLearn(true)
    router.push('/the-problem')
  }

  useEffect(() => {
    const onDone = () => {
      const elapsed = Date.now() - (learnStartRef.current || 0)
      const remaining = Math.max(0, MIN_LOAD_MS - elapsed)
      if (remaining > 0) setTimeout(() => setLoadingLearn(false), remaining)
      else setLoadingLearn(false)
    }
    router.events.on('routeChangeComplete', onDone)
    router.events.on('routeChangeError', onDone)
    return () => {
      router.events.off('routeChangeComplete', onDone)
      router.events.off('routeChangeError', onDone)
    }
  }, [router.events])

  return (
    <main style={{background:'#000', color:'#fff'}}>
      <section style={{textAlign:'center', padding:'80px 16px 40px', maxWidth:1100, margin:'0 auto'}}>
        <div style={{display:'inline-block', padding:'6px 14px', borderRadius:20, border:'1px solid rgba(var(--color-neon-rgb),0.08)', color:'var(--color-neon)', marginBottom:18}}>Donor Management Software</div>
        <h1 style={{fontSize:48, lineHeight:1.05, margin:0, fontWeight:800}}>Donor Relationships <span style={{color:'var(--color-neon)'}}>Built for Impact</span></h1>
        <p style={{maxWidth:860, margin:'20px auto', color:'#bdbdbd'}}>A secure, AI-powered CRM designed specifically for nonprofit teams to strengthen donor relationships and maximize fundraising impact.</p>

        <div style={{marginTop:18, display:'flex', gap:12, justifyContent:'center', alignItems:'center', flexWrap:'wrap'}}>
          <button onClick={handleLearn} className={`btn btn-primary`} style={{padding:'12px 20px', fontWeight:700, display:'inline-flex', alignItems:'center', justifyContent:'center'}}>Learn More</button>
          <Link href="/signin" className="btn btn-ghost" title="You'll be prompted to sign in to access your dashboard" style={{textDecoration:'none', padding:'12px 20px', fontWeight:700, display:'inline-flex', alignItems:'center', justifyContent:'center'}}>View My Dashboard</Link>
        </div>

      {loadingLearn && (
        <div className="page-loader" role="status" aria-live="polite">
          <div style={{textAlign:'center'}}>
            <div className="spinner-lg" />
            <div style={{marginTop:16, color:'#d0d0d0', fontSize:16}}>Loading — preparing the page…</div>
          </div>
        </div>
      )}
      </section>

      <section style={{maxWidth:960, margin:'40px auto', padding:'0 16px 40px'}}>
        <div style={{display:'grid', gap:18}}>
            <div className="feature-card" style={{display:'flex', gap:16, alignItems:'center'}}>
              <div style={{width:56, height:56, borderRadius:10, background:'rgba(var(--color-neon-rgb),0.06)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--color-neon)', fontSize:22}}>
                📦
              </div>
              <div>
                <h4>Centralized Data</h4>
                <p>Manage donors, donations, and engagement in one clear system</p>
              </div>
            </div>

            <div className="feature-card" style={{display:'flex', gap:16, alignItems:'center'}}>
              <div style={{width:56, height:56, borderRadius:10, background:'rgba(var(--color-neon-rgb),0.06)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--color-neon)', fontSize:22}}>
                ⚡
              </div>
              <div>
                <h4>AI-Powered Insights</h4>
                <p>Identify donor risk, trends, and suggested next steps</p>
              </div>
            </div>

            <div className="feature-card" style={{display:'flex', gap:16, alignItems:'center'}}>
              <div style={{width:56, height:56, borderRadius:10, background:'rgba(var(--color-neon-rgb),0.06)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--color-neon)', fontSize:22}}>
                🔒
              </div>
              <div>
                <h4>Built for Privacy</h4>
                <p>Secure, responsible AI with admin oversight and control</p>
              </div>
            </div>
        </div>
      </section>

      <footer style={{padding:'28px 16px', borderTop:'1px solid rgba(255,255,255,0.02)', textAlign:'center', color:'#8f8f8f'}}>
        <div style={{maxWidth:960, margin:'0 auto'}}>
          <p style={{margin:0, color:'#bdbdbd'}}>Join nonprofit teams making data-driven fundraising decisions with Nerd Street CRM.</p>
          <div style={{marginTop:12, fontSize:13, color:'#8f8f8f'}}>
            © 2026 Nerd Street CRM. Built for nonprofits.
          </div>
        </div>
      </footer>
    </main>
  )
}
