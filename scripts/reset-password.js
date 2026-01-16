#!/usr/bin/env node
require('dotenv').config()
const bcrypt = require('bcryptjs')
const { getPrisma } = require('../lib/prisma')

async function main() {
  const argv = process.argv.slice(2)
  const email = (argv[0] || process.env.EMAIL || 'rob@example.com').trim().toLowerCase()
  const password = argv[1] || process.env.PASSWORD || 'chocolate'
  if (!email || !password) {
    console.error('Usage: node scripts/reset-password.js <email> <password>')
    process.exit(2)
  }
  const prisma = getPrisma()
  try {
    let user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } }).catch(()=>null)
      if (!user) {
        console.error('User not found for', email)
        process.exit(1)
      }
    }
    const hashed = await bcrypt.hash(password, 10)
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
    console.log('Password reset for', user.email)
    process.exit(0)
  } catch (err) {
    console.error('Error resetting password', err)
    process.exit(1)
  }
}

main()
