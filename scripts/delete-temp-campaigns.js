#!/usr/bin/env node
const { getPrisma } = require('../lib/prisma')

async function main() {
  const prisma = getPrisma()
  try {
    const camps = await prisma.campaigns.findMany({ where: { name: 'Temporary Test Campaign' } })
    console.log('Found campaigns:', camps.map(c=>({ id: c.id, name: c.name })))
    if (!camps || camps.length === 0) {
      console.log('No Temporary Test Campaign entries found.')
      return
    }
    for (const c of camps) {
      try {
        const delD = await prisma.donation.deleteMany({ where: { campaignId: c.id } })
        console.log(`Deleted donations for campaign ${c.id}:`, delD.count)
      } catch (e) {
        console.warn('Failed deleting donations for', c.id, e)
      }
      try {
        await prisma.campaigns.delete({ where: { id: c.id } })
        console.log('Deleted campaign', c.id)
      } catch (e) {
        console.warn('Failed deleting campaign', c.id, e)
      }
    }
  } catch (err) {
    console.error('Error deleting temp campaigns', err)
    process.exit(1)
  } finally {
    try { await prisma.$disconnect() } catch(e){}
  }
}

main()
