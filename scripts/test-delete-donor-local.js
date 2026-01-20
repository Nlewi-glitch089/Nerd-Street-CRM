#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')
require('dotenv').config({ path: '.env.local' })

async function run() {
  const prisma = new PrismaClient()
  try {
    const user = await prisma.user.findUnique({ where: { email: 'rob.admin@example.com' } })
    if (!user) {
      console.error('Rob not found')
      process.exit(2)
    }
    const donor = await prisma.donor.findFirst()
    if (!donor) {
      console.error('No donor found to test')
      process.exit(2)
    }
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' })
    const url = 'http://localhost:3000/api/admin/delete-donor'
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ id: donor.id, password: 'chocolate' }) })
    const data = await res.json().catch(()=>null)
    console.log('HTTP', res.status, data)
    process.exit(0)
  } catch (err) {
    console.error('test error', err)
    process.exit(1)
  }
}

run()
