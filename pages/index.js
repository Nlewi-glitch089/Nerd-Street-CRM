import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Home() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('TEAM_MEMBER')
  const [user, setUser] = useState(null)
  const router = useRouter()

  async function handleSignUp(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault()
    setMessage(null)
    if (!email || !password || !fullName) {
      setMessage({ type: 'error', text: 'Please provide name, email and password.' })
      return
    }
    const emailNorm = String(email || '').trim().toLowerCase()
    // require corporate domain and safe local-part
    const allowedDomain = '@nerdstgamers.com'
    const localPartPattern = /^[a-z0-9._-]+$/
    if (!emailNorm.endsWith(allowedDomain) || !localPartPattern.test(emailNorm.slice(0, -allowedDomain.length))) {
      setMessage({ type: 'error', text: `Please use an email like name${allowedDomain} (letters, numbers, dot, underscore or hyphen allowed).` })
      return
    }
    if (String(password).length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }
    setLoading(true)
    try {
      // always create TEAM_MEMBER via public signup
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName, email: emailNorm, password, role: 'TEAM_MEMBER' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Signup failed')
      setMessage({ type: 'success', text: 'Account created. You can now sign in.' })
      // Optionally switch to sign-in mode
      setMode('signin')
      setFullName('')
      setPassword('')
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  function handleSignIn(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault()
    setMessage(null)
    if (!email || !password) {
      setMessage({ type: 'error', text: 'Please provide email and password.' })
      return
    }
    setLoading(true)
    ;(async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Login failed')
        const token = data.token
        // store token locally for subsequent requests (replace with cookie for production)
        try { localStorage.setItem('token', token) } catch (e) {}
        // verify protected endpoint
        const p = await fetch('/api/protected', { headers: { Authorization: `Bearer ${token}` } })
        const pd = await p.json()
        if (!p.ok) throw new Error(pd?.error || 'Protected check failed')
        // set user state so UI reflects logged-in status
        setUser(pd.user || null)
        const role = pd.user?.role || 'TEAM_MEMBER'
        const roleLabel = role === 'ADMIN' ? 'Admin' : 'Team member'
        // show a role-specific success + loading message so user sees which dashboard will load
        setMessage({ type: 'success', text: `Successfully signed in as ${roleLabel}. Loading ${roleLabel} dashboard...` })
        // give the user a moment (3.5s) to read the confirmation before navigating
        try { await new Promise(r => setTimeout(r, 3500)) } catch (e) {}
        if (role === 'ADMIN') await router.push('/admin')
        else await router.push('/team')
      } catch (err) {
        setMessage({ type: 'error', text: err.message })
      } finally {
        setLoading(false)
      }
    })()
  }

  const signupFormRef = useRef(null)
  const signinFormRef = useRef(null)

  function topSignUpClick() {
    if (mode !== 'signup') {
      setMode('signup')
      setMessage(null)
      return
    }
    // if already in signup mode, submit the signup form
    if (signupFormRef.current) signupFormRef.current.requestSubmit()
  }

  function topSignInClick() {
    if (mode !== 'signin') {
      setMode('signin')
      setMessage(null)
      return
    }
    if (signinFormRef.current) signinFormRef.current.requestSubmit()
  }

  // check for existing token on mount and validate it
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const token = (() => { try { return localStorage.getItem('token') } catch (e) { return null } })()
        if (!token) return
        const res = await fetch('/api/protected', { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) {
          // invalid token, clear
          try { localStorage.removeItem('token') } catch (e) {}
          return
        }
        const data = await res.json()
        if (mounted) setUser(data.user || null)
        // if the session belongs to an admin, redirect to admin dashboard
        if (data?.user?.role === 'ADMIN') {
          try { router.push('/admin') } catch (e) {}
        }
      } catch (err) {
        try { localStorage.removeItem('token') } catch (e) {}
      }
    })()
    return () => { mounted = false }
  }, [])

  function handleSignOut() {
    try { localStorage.removeItem('token') } catch (e) {}
    setUser(null)
    setMessage({ type: 'success', text: 'Signed out' })
    // optionally reset other form state
    setEmail('')
    setPassword('')
    setMode('signin')
  }

  return (
    <main className="page">
      <div className="card auth-card">
        <h1 className="title">Nerd Street CRM</h1>
        <p className="subtitle">Secure donor management for small nonprofits</p>

        <div style={{display:'flex', gap:8, justifyContent:'center', marginBottom:12}}>
          <button
            className={`btn ${mode==='signin'? 'btn-primary' : 'btn-ghost'}`}
            onClick={topSignInClick}
          >
            Sign In
          </button>
          <button
            className={`btn ${mode==='signup'? 'btn-primary' : 'btn-ghost'}`}
            onClick={topSignUpClick}
          >
            Sign Up
          </button>
        </div>

        {user ? (
          <div style={{textAlign:'center'}}>
            <p style={{marginBottom:12}}>Welcome, <strong>{user.name || user.email}</strong></p>
            <div className="actions">
              <button className="btn btn-ghost" onClick={handleSignOut}>Sign out</button>
            </div>
          </div>
        ) : mode === 'signup' ? (
          <form ref={signupFormRef} onSubmit={handleSignUp}>
            <div className="field">
              <label className="label">Full name</label>
              <input className="input" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="John Doe" autoComplete="name" />
            </div>

            <div className="field">
              <label className="label">Email</label>
              <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@nerdstgamers.com" autoComplete="email" />
            </div>

            <div className="field">
              <label className="label">Password</label>
              <input className="input" value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="••••••••" autoComplete="new-password" />
            </div>

            {/* Role is fixed to Team Member for public signup to prevent users creating admin accounts */}

            <div className="actions">
              <button className="btn btn-primary" type="submit" disabled={loading}>{loading? 'Creating...' : 'Sign Up'}</button>
            </div>
          </form>
        ) : (
          <form ref={signinFormRef} onSubmit={handleSignIn}>
            <div className="field">
              <label className="label">Email</label>
              <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@nerdstgamers.com" autoComplete="email" />
            </div>

            <div className="field">
              <label className="label">Password</label>
              <input className="input" value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="••••••••" autoComplete="current-password" />
            </div>

            <div className="actions">
              <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
            </div>
          </form>
        )}

        {message && (
          <p style={{marginTop:12, textAlign:'center', color: message.type === 'error' ? '#ff8080' : message.type === 'success' ? 'var(--color-neon)' : 'var(--color-gray)'}}>
            {message.text}
          </p>
        )}

      </div>
    </main>
  )
}
