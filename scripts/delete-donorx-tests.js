#!/usr/bin/env node
const { getPrisma } = require('../lib/prisma')

async function main() {
  const prisma = getPrisma()
  try {
    const matches = await prisma.donor.findMany({
      where: {
        OR: [
          { firstName: { contains: 'DonorX' } },
          { lastName: { contains: 'Test' } },
          { email: { startsWith: 'donor+', endsWith: '@example.com' } }
        ]
      }
    })

    console.log('Matched donors:', matches.map(d => ({ id: d.id, email: d.email, name: d.name })))
    if (!matches || matches.length === 0) {
      console.log('No matching donors found.')
      return
    }

    let totalDonors = 0
    let totalDonations = 0
    for (const d of matches) {
      try {
        const del = await prisma.donation.deleteMany({ where: { donorId: d.id } })
        console.log(`Deleted donations for donor ${d.id}:`, del.count)
        totalDonations += del.count || 0
      } catch (e) {
        console.warn('Failed to delete donations for', d.id, e.message || e)
      }
      try {
        await prisma.donor.delete({ where: { id: d.id } })
        console.log('Deleted donor', d.id)
        totalDonors++
      } catch (e) {
        console.warn('Failed to delete donor', d.id, e.message || e)
      }
    }

    console.log(`Summary: deleted ${totalDonors} donors and ${totalDonations} donations`)
  } catch (err) {
    console.error('Error running deletion:', err)
    process.exitCode = 1
  } finally {
    try { await prisma.$disconnect() } catch(e){}
  }
}

main()
