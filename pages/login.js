import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function LoginRedirect() {
  const router = useRouter()
  useEffect(() => {
    try { router.replace('/') } catch (e) { console.warn('Redirect failed', e) }
  }, [])
  // return a minimal JSX element so Next recognizes this as a React component
  return <div style={{display:'none'}} />
}
