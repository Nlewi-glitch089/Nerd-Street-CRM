export default function TheProblem() {
  return (
    <main style={{padding:40, maxWidth:900, margin:'0 auto'}}>
      <h1 style={{color:'var(--color-neon)'}}>Problem Explained</h1>

      <div className="problem-grid" style={{marginTop:12}}>
        <div className="card problem-card">
          <h3>Nonprofits struggle to track donors, donations, and engagement in one clear, actionable system.</h3>
          <p style={{marginTop:8}}>Teams often juggle spreadsheets, email archives, and fragmented notes—losing sight of relationships, missing renewal windows, and burning out staff with manual administrative work.</p>
        </div>

        <div className="card problem-card">
          <h4 style={{color:'var(--color-neon)'}}>Why It Matters</h4>
          <p style={{marginTop:8}}>Donor retention and timely engagement directly impact program funding and mission impact. Small teams need straightforward tools to maintain healthy relationships and make data-driven decisions—not enterprise software that adds complexity.</p>
        </div>

        <div className="card problem-card">
          <h4 style={{color:'var(--color-neon)'}}>Who Is Affected</h4>
          <p style={{marginTop:8}}>Development teams, program managers, volunteers, and ultimately the communities served by nonprofit organizations who depend on consistent funding and engaged supporters.</p>
        </div>

        <div className="card problem-card">
          <h4 style={{color:'var(--color-neon)'}}>If Unsolved</h4>
          <p style={{marginTop:8}}>Organizations may see declining funding, missed renewal opportunities, and inefficient outreach that wastes limited staff time and reduces the impact of mission-driven work.</p>
        </div>

        <div className="card problem-card">
          <h4 style={{color:'var(--color-neon)'}}>How We're Different</h4>
          <p style={{marginTop:8}}>Nerd Street CRM centralizes donors and donations, links gifts to donor records, surfaces actionable AI-driven insights, and focuses on simple workflows for small teams rather than enterprise complexity. Built specifically for nonprofits, by people who understand the space.</p>
        </div>
      </div>
    </main>
  )
}
