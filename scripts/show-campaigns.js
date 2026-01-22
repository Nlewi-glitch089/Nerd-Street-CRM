#!/usr/bin/env node
require('dotenv').config()
const { getPrisma } = require('../lib/prisma')

async function main(){
  const prisma = getPrisma()
  try{
    const camps = await prisma.campaigns.findMany({
      select: {
        id: true,
        name: true,
        goal: true,
        approved: true,
        active: true,
        createdAt: true,
        donations: { select: { id: true, amount: true, date: true, donorId: true, method: true, notes: true } }
      }
    })
    camps.forEach(c => {
      const raised = (c.donations || []).reduce((s,d)=>s + (Number(d.amount||0)||0), 0)
      const gifted = (c.donations || []).filter(d=>{ try { const m=String(d.method||'').toLowerCase(); const n=String(d.notes||'').toLowerCase(); return /gift/.test(m)||/gift/.test(n) } catch(e){return false} }).reduce((s,d)=>s + (Number(d.amount||0)||0), 0)
      console.log(`${c.name} | goal=${c.goal || 0} | raised=${raised} | gifted=${gifted} | approved=${c.approved}`)
    })
    process.exit(0)
  }catch(e){ console.error(e); process.exit(1) }
}
main()
