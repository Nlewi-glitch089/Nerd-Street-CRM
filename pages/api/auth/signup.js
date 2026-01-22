import bcrypt from 'bcryptjs'
import { getPrisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { name, email, password, role } = req.body || {}
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing name, email or password' })

  // basic validation
  const emailNorm = String(email || '').trim().toLowerCase()
  const passwordStr = String(password || '')
  // require corporate domain
  const allowedDomain = '@nerdstgamers.com'
  const localPartPattern = /^[a-z0-9._-]+$/
  if (!emailNorm.endsWith(allowedDomain) || !localPartPattern.test(emailNorm.slice(0, -allowedDomain.length))) {
    return res.status(400).json({ error: `Email must be like name${allowedDomain} (only letters, numbers, dot, underscore or hyphen in the local part)` })
  }
  if (passwordStr.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }
  // Do NOT allow clients to create ADMIN accounts via signup.
  // All signups are created as TEAM_MEMBER. Admins must be created/managed by existing admins.
  const roleNorm = 'TEAM_MEMBER'

  try {
    // split name into first/last
    const [firstName, ...rest] = name.trim().split(' ')
    const lastName = rest.length ? rest.join(' ') : null

    // hash password before storing
    const prisma = getPrisma()
    const hashed = await bcrypt.hash(passwordStr, 10)
    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: emailNorm,
        password: hashed,
        role: roleNorm
      }
    })

    // Seed lightweight, randomized demo/team data for this new user
    try {
      await seedDemoForNewUser(prisma, user)
    } catch (seedErr) {
      console.warn('Failed to seed demo data for new user', seedErr)
    }

    return res.status(201).json({ ok: true, id: user.id })
  } catch (err) {
    // Prisma unique constraint error handling
    console.error('signup handler error', err)
    const message = err?.meta?.target ? `A record already exists for: ${err.meta.target}` : (err && err.message) || String(err)
    return res.status(500).json({ error: message })
  }
}

async function seedDemoForNewUser(prisma, user) {
  if (!prisma || !user) return
  const now = Date.now()
  const days = (n) => new Date(now - n * 24 * 60 * 60 * 1000)
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)]

  // simple randomized donors tied to this demo user (emails include user id to avoid collisions)
  const demoSuffix = (user.id || '').slice(0, 8)
  const demoDonors = [
    { firstName: 'Alex', lastName: 'Reyes' },
    { firstName: 'Jordan', lastName: 'Kim' },
    { firstName: 'Taylor', lastName: 'Bishop' }
  ].map((d, i) => ({ ...d, email: `demo+${demoSuffix}+${i}@example.com` }))

  const createdDonors = []
  for (const d of demoDonors) {
    try {
      const created = await prisma.donor.create({ data: { firstName: d.firstName, lastName: d.lastName, email: d.email, totalGiving: Math.floor(Math.random() * 5000), lastGiftAt: rand([days(5), days(10), days(35), null]) } })
      createdDonors.push(created)
    } catch (e) {
      console.warn('seedDemo: failed to create donor', d.email, e)
    }
  }

  // create a couple of lightweight campaigns/events to vary the dashboard
  const campNames = [
    `Local Outreach ${demoSuffix}`,
    `Community Drive ${demoSuffix}`
  ]
  for (const name of campNames) {
    try {
      await prisma.campaigns.create({ data: { name, goal: 10000 + Math.floor(Math.random() * 50000), approved: Math.random() > 0.5 } })
    } catch (e) {
      // ignore collisions
    }
  }

  try {
    await prisma.event.create({ data: { title: `Intro Meeting - ${user.name}`, description: 'Welcome meeting and team intro', startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } })
  } catch (e) {}

  // create a few tasks either tied to a demo donor or general team tasks
  const taskTitles = [
    'Follow up on sponsorship lead',
    'Prepare outreach email',
    'Update donor CRM records'
  ]
  for (let i = 0; i < 4; i++) {
    try {
      const donor = createdDonors.length ? rand(createdDonors) : null
      await prisma.task.create({ data: { donorId: donor ? donor.id : null, title: rand(taskTitles), notes: 'Auto-generated demo task', dueAt: new Date(Date.now() + (i + 2) * 24 * 60 * 60 * 1000) } })
    } catch (e) {
      console.warn('seedDemo: failed to create task', e)
    }
  }

  // record an ActionLog entry to indicate demo seeding (useful for auditing)
  try {
    await prisma.actionLog.create({ data: { action: 'SEED_DEMO_DATA', targetType: 'User', targetId: user.id, userId: user.id, actorName: user.name || user.email, meta: { seededAt: new Date().toISOString() } } })
  } catch (e) {
    // non-fatal
  }
}
