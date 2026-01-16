export default function AIPolicy() {
  return (
    <main style={{padding:40, maxWidth:980, margin:'0 auto'}}>
      <h1 style={{color:'var(--color-neon)'}}>AI Policy & Safeguards</h1>

      <div style={{marginTop:12, display:'grid', gap:12}}>
        <div className="card problem-card">
          <h4 style={{color:'var(--color-neon)'}}>Model and API</h4>
          <p style={{marginTop:8, color:'#d0d0d0'}}>This project uses an external language model via a server-side API route. In production, we recommend using a provably responsible provider (such as OpenAI or similar) with scoped API keys and audit logging enabled. All API calls are logged for transparency and continuous improvement.</p>
        </div>

        <div className="card problem-card">
          <h4 style={{color:'var(--color-neon)'}}>Prompt Design</h4>
          <p style={{marginTop:8, color:'#d0d0d0'}}>Prompts are designed to avoid sending raw PII. The AI receives aggregated or anonymized donor activity (counts, recency, and engagement signals) and is explicitly asked to return prioritized, actionable suggestions rather than exact donor text or sensitive data.</p>
          <div style={{marginTop:10, background:'rgba(0,0,0,0.12)', padding:10, borderRadius:6, border:'1px solid rgba(var(--color-neon-rgb),0.04)'}}>
            <code style={{color:'#bfbfbf'}}>Example: "Count: 5 dormant donors, Avg days since gift: 487" → Actionable suggestions</code>
          </div>
        </div>

        <div className="card problem-card">
          <h4 style={{color:'var(--color-neon)'}}>How AI Improves Decision-Making</h4>
          <p style={{marginTop:8, color:'#d0d0d0'}}>AI helps identify donor risk, highlight trends, and propose next steps—enabling small teams to make data-driven decisions faster without requiring deep analytics expertise.</p>
          <div style={{marginTop:10, display:'grid', gap:8}}>
            <div style={{border:'1px solid rgba(var(--color-neon-rgb),0.06)', padding:8, borderRadius:6}}><strong style={{color:'var(--color-neon)'}}>Risk Identification</strong> — flags dormant donors (6+ months)</div>
            <div style={{border:'1px solid rgba(var(--color-neon-rgb),0.06)', padding:8, borderRadius:6}}><strong style={{color:'var(--color-neon)'}}>Trend Analysis</strong> — identifies seasonal patterns</div>
            <div style={{border:'1px solid rgba(var(--color-neon-rgb),0.06)', padding:8, borderRadius:6}}><strong style={{color:'var(--color-neon)'}}>Action Planning</strong> — suggests outreach cadence</div>
          </div>
        </div>

        <div className="card problem-card">
          <h4 style={{color:'var(--color-neon)'}}>Responsible AI Usage</h4>
          <ul style={{marginTop:8, color:'#d0d0d0'}}>
            <li>AI outputs are advisory — human review is required before any donor outreach.</li>
            <li>Do not send full PII to the model — donor data is anonymized or aggregated before processing.</li>
            <li>Log all model inputs and outputs for an audit trail and continuous improvement.</li>
            <li>Admin override is always available — admins can reject, modify, or approve any suggestion before action.</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
