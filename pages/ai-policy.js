export default function AIPolicy() {
  return (
    <main style={{padding:40, maxWidth:980, margin:'0 auto'}}>
      <h1 style={{color:'var(--color-neon)'}}>AI Policy & Safeguards</h1>

      <div style={{marginTop:12, display:'grid', gap:12}}>
        <div className="card problem-card">
          <h4 style={{color:'var(--color-neon)'}}>Model & API Usage</h4>
          <p style={{marginTop:8, color:'#d0d0d0'}}>This CRM integrates an external language model through a secure, server-side API route. In production, the system is designed to use a responsible AI provider (e.g., OpenAI or equivalent) with scoped API keys and audit logging enabled. All AI requests and responses are logged to support transparency, monitoring, and continuous improvement.</p>
        </div>

        <div className="card problem-card">
          <h4 style={{color:'var(--color-neon)'}}>Data Handling & Prompt Design</h4>
          <p style={{marginTop:8, color:'#d0d0d0'}}>AI prompts are intentionally structured to prevent the transmission of raw personally identifiable information (PII). The model receives only aggregated or anonymized donor data, such as engagement counts, time since last interaction, or general activity signals. The AI is instructed to return prioritized, actionable recommendations rather than specific donor messages or sensitive content.</p>
          <div style={{marginTop:10, background:'rgba(0,0,0,0.12)', padding:10, borderRadius:6, border:'1px solid rgba(var(--color-neon-rgb),0.04)'}}>
            <code style={{color:'#bfbfbf'}}>&ldquo;5 dormant donors, average days since last gift: 487&rdquo; → Action-oriented suggestions for re-engagement strategy</code>
          </div>
        </div>

        <div className="card problem-card">
          <h4 style={{color:'var(--color-neon)'}}>Decision Support Capabilities</h4>
          <p style={{marginTop:8, color:'#d0d0d0'}}>The AI functions as a decision-support tool to help nonprofit teams quickly interpret donor data and plan next steps without requiring advanced analytics skills.</p>
          <div style={{marginTop:10, display:'grid', gap:8}}>
            <div style={{border:'1px solid rgba(var(--color-neon-rgb),0.06)', padding:8, borderRadius:6}}><strong style={{color:'var(--color-neon)'}}>Risk Identification</strong> — flags donors inactive for 6+ months</div>
            <div style={{border:'1px solid rgba(var(--color-neon-rgb),0.06)', padding:8, borderRadius:6}}><strong style={{color:'var(--color-neon)'}}>Trend Analysis</strong> — highlights engagement and seasonal patterns</div>
            <div style={{border:'1px solid rgba(var(--color-neon-rgb),0.06)', padding:8, borderRadius:6}}><strong style={{color:'var(--color-neon)'}}>Action Planning</strong> — suggests outreach timing and cadence</div>
          </div>
        </div>

        <div className="card problem-card">
          <h4 style={{color:'var(--color-neon)'}}>Responsible AI Use & Oversight</h4>
          <p style={{marginTop:8, color:'#d0d0d0'}}>AI-generated outputs are advisory and never executed automatically. Human review is required before any donor-facing action occurs.</p>
          <ul style={{marginTop:8, color:'#d0d0d0'}}>
            <li>No transmission of full PII to the model.</li>
            <li>Logged inputs and outputs for auditability.</li>
            <li>Admin-level controls to approve, modify, or reject AI suggestions at any time.</li>
          </ul>
          <p style={{marginTop:8, color:'#d0d0d0'}}>This approach ensures AI enhances decision-making while maintaining data privacy, accountability, and human oversight.</p>
        </div>
      </div>
    </main>
  )
}
