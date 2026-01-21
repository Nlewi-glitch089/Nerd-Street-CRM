// Generate a JWT for the seeded admin user
require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')

const prisma = new PrismaClient()

async function main(){
  const email = 'admin@nerdstreet.org'
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.error('No user found with email', email)
    console.error('Run: node prisma/seed.js')
    process.exit(1)
  }
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' })
  console.log(token)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
