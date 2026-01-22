// Upsert three admin users with hashed passwords
require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const admins = [
  { email: 'ZayW.admin@nerdstgamers.com', password: 'deathnote101', name: 'Zay W' },
  { email: 'FrenchieR.admin@nerdstgamers.com', password: '123456', name: 'Frenchie R' },
  { email: 'TaheeraB.admin@nerdstgamers.com', password: 'bonchan', name: 'Taheera B' }
]

async function main(){
  for (const a of admins) {
    const hashed = await bcrypt.hash(a.password, 10)
    const up = await prisma.user.upsert({
      where: { email: a.email },
      update: { password: hashed, role: 'ADMIN', name: a.name, active: true },
      create: { email: a.email, password: hashed, role: 'ADMIN', name: a.name, active: true }
    })
    console.log('Upserted admin:', up.email, up.id)
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
