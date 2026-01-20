#!/usr/bin/env node
const bcrypt = require('bcryptjs')
const { getPrisma } = require('../lib/prisma')
require('dotenv').config({ path: '.env.local' })

async function run() {
  const prisma = getPrisma()
  const email = 'rob.admin@example.com'
  try {
    let user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } }).catch(() => null)
    }
    if (!user) {
      console.error('User not found:', email)
      process.exit(2)
    }
    const hashed = await bcrypt.hash('chocolate', 10)
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
    console.log('Password for', email, 'updated to chocolate')
    process.exit(0)
  } catch (err) {
    console.error('Error updating password', err)
    process.exit(1)
  }
}

run()
