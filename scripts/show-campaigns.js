#!/usr/bin/env node
require('dotenv').config()
const { getPrisma } = require('../lib/prisma')

async function main(){
  const prisma = getPrisma()
  try{
    const camps = await prisma.campaigns.findMany({ include: { donations: true } })
    camps.forEach(c => {
      const raised = (c.donations || []).reduce((s,d)=>s + (Number(d.amount||0)||0), 0)
      const gifted = (c.donations || []).filter(d=>{ try { const m=String(d.method||'').toLowerCase(); const n=String(d.notes||'').toLowerCase(); return /gift/.test(m)||/gift/.test(n) } catch(e){return false} }).reduce((s,d)=>s + (Number(d.amount||0)||0), 0)
      console.log(`${c.name} | goal=${c.goal || 0} | raised=${raised} | gifted=${gifted} | approved=${c.approved}`)
    })
    process.exit(0)
  }catch(e){ console.error(e); process.exit(1) }
}
main()
