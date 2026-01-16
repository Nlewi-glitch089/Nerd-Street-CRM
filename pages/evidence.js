export default function Evidence() {
  return (
    <main style={{padding:40, maxWidth:900, margin:'0 auto'}}>
      <h1 style={{color:'var(--color-neon)'}}>EVIDENCE & RUBRIC</h1>
      <section style={{marginTop:12}}>
        <h2>CCC.1.3 Evidence</h2>
        <p>Links and artifacts demonstrating competency and completeness:</p>
        <ul>
          <li><a href="https://github.com/" target="_blank" rel="noreferrer">Source code (GitHub)</a> — link to repository</li>
          <li><a href="https://vercel.com/" target="_blank" rel="noreferrer">Deployment (Vercel)</a> — live app URL</li>
          <li><a href="https://trello.com/" target="_blank" rel="noreferrer">Project board (Trello)</a> — planning and tasks</li>
          <li>Wireframes — included in project assets or design folder</li>
        </ul>
        <h2>TS.6.2 & TS.6.3 Evidence</h2>
        <p>Testing and technical evidence: unit tests in the <code>test/</code> folder, API route implementations, and Prisma schema located in <code>prisma/schema.prisma</code>.</p>
      </section>
    </main>
  )
}
