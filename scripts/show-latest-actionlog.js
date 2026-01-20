#!/usr/bin/env node
const { getPrisma } = require('../lib/prisma')
require('dotenv').config({ path: '.env.local' })

async function run() {
  const prisma = getPrisma()
  try {
    const latest = await prisma.actionLog.findFirst({ orderBy: { createdAt: 'desc' } })
    if (!latest) {
      console.log('No action log entries found')
      process.exit(0)
    }
    const user = latest.userId ? await prisma.user.findUnique({ where: { id: latest.userId } }) : null
    const out = {
      id: latest.id,
      action: latest.action,
      targetType: latest.targetType,
      targetId: latest.targetId,
      meta: latest.meta || null,
      createdAt: latest.createdAt,
      user: user ? { id: user.id, name: user.name, email: user.email } : null
    }
    console.log(JSON.stringify(out, null, 2))
    process.exit(0)
  } catch (err) {
    console.error('Error fetching latest action log', err)
    process.exit(1)
  }
}

run()
