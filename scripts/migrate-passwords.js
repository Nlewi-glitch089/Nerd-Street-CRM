#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Starting password migration: hashing plaintext passwords...')
  const users = await prisma.user.findMany()
  let updated = 0
  for (const u of users) {
    const pwd = String(u.password || '')
    // detect bcrypt hashes (start with $2a$, $2b$, $2y$, etc.)
    if (!/^\$2[aby]\$/.test(pwd)) {
      const hashed = await bcrypt.hash(pwd, 10)
      await prisma.user.update({ where: { id: u.id }, data: { password: hashed } })
      updated++
      console.log(`Re-hashed password for ${u.email}`)
    }
  }
  console.log(`Password migration complete. ${updated} user(s) updated.`)
}

main().catch(err => {
  console.error('Migration error', err)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
