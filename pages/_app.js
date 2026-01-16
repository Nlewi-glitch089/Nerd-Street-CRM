import '../styles/globals.css'
import { useRouter } from 'next/router'
import { useState, useEffect, useRef } from 'react'

function Header() {
  const router = useRouter()
  const isHome = router?.pathname === '/'
  const hideOnDash = router?.pathname && (router.pathname.startsWith('/admin') || router.pathname.startsWith('/team'))
  const hideOnAuth = router?.pathname === '/signin' || router?.pathname === '/login'
  const [homeLoading, setHomeLoading] = useState(false)
  const [user, setUser] = useState(null)
  const homeStartRef = useRef(0)
  const MIN_LOAD_MS = 1500

  // hide loader when route change completes/errors with a minimum visible duration
  useEffect(() => {
    const onDone = () => {
      const elapsed = Date.now() - (homeStartRef.current || 0)
      const remaining = Math.max(0, MIN_LOAD_MS - elapsed)
      if (remaining > 0) {
        setTimeout(() => {
          setHomeLoading(false)
          try { document.documentElement.classList.remove('nsc-loading') } catch (e) {}
        }, remaining)
      } else {
        setHomeLoading(false)
        try { document.documentElement.classList.remove('nsc-loading') } catch (e) {}
      }
    }
    router.events.on('routeChangeComplete', onDone)
    router.events.on('routeChangeError', onDone)
    return () => {
      router.events.off('routeChangeComplete', onDone)
      router.events.off('routeChangeError', onDone)
    }
  }, [router.events])

  // expose a starter so other pages can trigger the same header loading UI
  useEffect(() => {
    window.startHomeLoading = () => {
      // add a DOM class first so overlay appears synchronously (prevents flash)
      try { document.documentElement.classList.add('nsc-loading') } catch (e) {}
      homeStartRef.current = Date.now()
      setHomeLoading(true)
    }
    return () => { delete window.startHomeLoading }
  }, [])

  // fetch current user (if token present) to decide whether to show admin controls
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
        if (!token) return
        const res = await fetch('/api/protected', { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) return
        const data = await res.json()
        if (mounted) setUser(data?.user || null)
      } catch (err) {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [])

  // make sure we clean up the class if this component unmounts
  useEffect(() => {
    return () => { try { document.documentElement.classList.remove('nsc-loading') } catch (e) {} }
  }, [])

  if (hideOnAuth) return null

  return (
    <header style={{borderBottom:'1px solid rgba(255,255,255,0.04)', padding:'12px 18px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
      <div>
        <a href="/" onClick={(e)=>{e.preventDefault(); setHomeLoading(true); router.push('/')}} style={{color:'var(--color-neon)', fontWeight:800, textDecoration:'none'}}>NERD STREET CRM</a>
      </div>
      {!isHome && !hideOnDash ? (
        <nav style={{display:'flex', gap:12, alignItems:'center'}}>
          <a href="/the-problem" style={{color:'#ddd', textDecoration:'none'}}>The Problem</a>
          <a href="/why" style={{color:'#ddd', textDecoration:'none'}}>Why This CRM</a>
          <a href="/ai-policy" style={{color:'#ddd', textDecoration:'none'}}>AI Policy</a>
          <button
            className="btn"
            onClick={(e)=>{
              e.preventDefault();
              // trigger the same synchronous DOM overlay + React loader
              if (typeof window !== 'undefined' && window.startHomeLoading) {
                window.startHomeLoading()
              } else {
                try { document.documentElement.classList.add('nsc-loading') } catch (err) {}
                homeStartRef.current = Date.now();
                setHomeLoading(true)
              }
              router.push('/')
            }}
            style={{marginLeft:8}}
          >
            {homeLoading ? <span className="spinner" /> : 'Back'}
          </button>
        </nav>
      ) : <div />}

      {/* right-side controls: show admin settings icon when user is ADMIN */}
      <div style={{display:'flex', alignItems:'center', gap:8}}>
        {user?.role === 'ADMIN' && router.pathname && router.pathname.startsWith('/admin') && (
          <button className="btn btn-ghost" title="Admin Settings" onClick={(e)=>{e.preventDefault(); router.push('/admin/settings')}} style={{marginLeft:8}}>
            ⚙️
          </button>
        )}
      </div>

      {homeLoading && (
        <div className="page-loader" role="status" aria-live="polite">
          <div style={{textAlign:'center'}}>
            <div className="spinner-lg" />
            <div style={{marginTop:12, color:'#d0d0d0'}}>Loading…</div>
          </div>
        </div>
      )}
    </header>
  )
}

export default function App({ Component, pageProps }) {
  return (
    <div>
      <Header />
      <Component {...pageProps} />
    </div>
  )
}
