export default function Why() {
  return (
    <main style={{padding:40, maxWidth:980, margin:'0 auto'}}>
      <h1 style={{color:'var(--color-neon)'}}>What the App Does and Why It Exists</h1>

      <div style={{marginTop:12, display:'grid', gap:12}}>
        <div className="card problem-card">
          <h4 style={{color:'var(--color-neon)'}}>Overview</h4>
          <p style={{marginTop:8}}>Nerd Street CRM centralizes donor and donation data, surfaces engagement risk, suggests follow-up actions, and provides simple dashboards to help small nonprofit teams prioritize outreach. It exists because nonprofits deserve tools that work the way they think, not the way enterprise software demands.</p>
        </div>

        <div className="card problem-card">
          <h4 style={{color:'var(--color-neon)'}}>Key Features and Why They Were Chosen</h4>
          <ul className="evidence-list" style={{marginTop:8}}>
            <li><strong>Donor & Donation Records</strong> - Primary entities for fundraising workflows - essential to track who gives, how much, and when.</li>
            <li><strong>Dashboard Summaries</strong> - Quick health checks for teams with limited time - at a glance totals, revenue, and engagement trends.</li>
            <li><strong>AI Insights</strong> - Planning assistance that suggests targeted actions (e.g., outreach cadence, risk flagging) rather than generic summaries.</li>
            <li><strong>Role-Based Access</strong> - Separate admin and team workflows to protect sensitive operations and maintain data governance.</li>
          </ul>
        </div>

        <div className="card problem-card">
          <h4 style={{color:'var(--color-neon)'}}>Expected Challenges and Planning</h4>
          <p style={{marginTop:8}}>We expect data quality, privacy, and model trust to be primary challenges. The design focuses on minimizing PII exposure to models, keeping AI suggestions advisory, and allowing admins to review and override recommendations before any outreach occurs.</p>
        </div>

        <div className="card problem-card">
          <h4 style={{color:'var(--color-neon)'}}>High-Level System Summary</h4>
          <div style={{marginTop:8}}>
            <p style={{color:'#d0d0d0', margin:0}}>Pages: Public landing pages (Home, Problem, Why This CRM) guide users before login. Authenticated pages (Dashboard, Donors, Donations, Campaigns, Admin) power the CRM after login.</p>
            <p style={{color:'#d0d0d0', margin:'8px 0 0 0'}}>Data Flow: Database stores donors and donations. API routes protect sensitive operations. AI features call a dedicated AI API that uses aggregated, anonymized activity data to return suggested actions rather than raw donor details.</p>
            <p style={{color:'#d0d0d0', margin:'8px 0 0 0'}}>AI Integration: All AI features call a dedicated route that applies privacy-first prompting. Suggestions are advisory, logged, and reviewed by admins before outreach.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
