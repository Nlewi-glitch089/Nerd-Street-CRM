#!/usr/bin/env node
require('dotenv').config()
const { getPrisma } = require('../lib/prisma')

async function main(){
  const prisma = getPrisma()
  const nameArg = process.argv[2] || 'Holiday Giving Drive 2025'
  try{
    const campaign = await prisma.campaigns.findFirst({ where: { name: nameArg }, include: { donations: true } })
    if (!campaign) {
      console.error('Campaign not found:', nameArg)
      process.exit(1)
    }
    const goal = Number(campaign.goal || 0)
    if (!goal || goal <= 0) {
      console.error('Campaign has no positive goal set. Aborting.')
      process.exit(1)
    }
    const current = (campaign.donations || []).reduce((s,d)=>s + (Number(d.amount||0)||0), 0)
    console.log('Campaign', campaign.name, 'goal', goal, 'current', current)
    if (current >= goal) {
      console.log('Already at or above goal; marking approved and exiting.')
      await prisma.campaigns.update({ where: { id: campaign.id }, data: { approved: true } })
      process.exit(0)
    }
    const needed = goal - current
    // split into multiple donations for realism; default parts=4 (can pass as argv[3])
    const parts = Math.max(1, parseInt(process.argv[3] || '4', 10))
    const neededCents = Math.round((needed || 0) * 100)
    if (neededCents <= 0) {
      console.log('No amount needed to top up.')
      await prisma.campaigns.update({ where: { id: campaign.id }, data: { approved: true } })
      process.exit(0)
    }
    const base = Math.floor(neededCents / parts)
    const remainder = neededCents - base * parts

    // fetch existing donors to attribute gifts; create additional seed donors if necessary
    let donors = await prisma.donor.findMany({ take: parts, orderBy: { createdAt: 'asc' } })
    while (donors.length < parts) {
      const idx = donors.length + 1
      const email = `seed.donor${idx}@example.com`
      const d = await prisma.donor.create({ data: { firstName: `Seed${idx}`, lastName: 'Donor', email, totalGiving: 0 } })
      donors.push(d)
    }

    for (let i = 0; i < parts; i++) {
      const amountCents = base + (i === 0 ? remainder : 0)
      const amount = amountCents / 100
      if (amount <= 0) continue
      const donor = donors[i % donors.length]
      await prisma.donation.create({ data: { donorId: donor.id, campaignId: campaign.id, amount, method: 'credit_card', notes: 'Auto-filled to reach goal for demo' } })
      // update donor totals and lastGiftAt for consistency
      try {
        await prisma.donor.update({ where: { id: donor.id }, data: { totalGiving: { increment: amount }, lastGiftAt: new Date() } })
      } catch (e) {
        // prisma does not support increment on Float in some setups; fallback to compute
        try {
          const cur = await prisma.donor.findUnique({ where: { id: donor.id } })
          const newTotal = (Number(cur.totalGiving || 0) || 0) + amount
          await prisma.donor.update({ where: { id: donor.id }, data: { totalGiving: newTotal, lastGiftAt: new Date() } })
        } catch (e2) {
          console.warn('Failed to update donor total for', donor.id, e2)
        }
      }
      console.log('Inserted donation', amount, 'for donor', donor.email)
    }

    // mark campaign approved
    await prisma.campaigns.update({ where: { id: campaign.id }, data: { approved: true } })
    console.log('Inserted donations totaling', needed, 'and marked campaign approved.')
    process.exit(0)
  }catch(e){
    console.error('Error', e)
    process.exit(2)
  }
}

main()
