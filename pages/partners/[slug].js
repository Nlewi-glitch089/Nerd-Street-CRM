import { useRouter } from 'next/router'

export default function PartnerPage() {
  const router = useRouter()
  const { slug } = router.query || {}

  return (
    <div style={{padding:20}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <button className="btn btn-ghost" onClick={() => router.push('/team')}>← Back to Dashboard</button>
        </div>
      </div>
      <h1 style={{marginTop:20}}>Partner: {slug || 'Unknown'}</h1>
      <p style={{color:'#bbb'}}>This partner detail view is simplified for stability. Original partner UI was extensive; restore when needed.</p>
    </div>
  )
}
