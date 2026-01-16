export default function Reflection() {
  return (
    <main style={{padding:40, maxWidth:900, margin:'0 auto'}}>
      <h1 style={{color:'var(--color-neon)'}}>REFLECTION</h1>
      <section style={{marginTop:12}}>
        <h2>Biggest challenge</h2>
        <p>The hardest part was balancing useful AI-driven suggestions while protecting donor privacy and avoiding over-reliance on automated outputs.</p>
        <h2>What I'd improve with more time</h2>
        <p>Integrate stronger data validation, richer donor activity modeling, and end-to-end tests for AI prompts and outputs.</p>
        <h2>What I learned</h2>
        <p>Building a product for real teams forces trade-offs: simplicity for users, strong defaults for privacy, and designs that support human-in-the-loop decision-making.</p>
        <h2>How AI helped (and where it didn't)</h2>
        <p>AI provided planning suggestions and trend summaries quickly, but it should not replace human judgment when communicating with donors or making sensitive decisions.</p>
      </section>
    </main>
  )
}
