import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { beforeAll, afterAll, test, expect } from 'vitest'
import { PrismaClient } from '@prisma/client'
import donorsIndex from '../pages/api/donors/index'
import { signToken } from '../lib/auth'

const prisma = new PrismaClient()
global.__prisma = prisma

function createReqRes({ method = 'GET', body = undefined, headers = {}, query = {} } = {}) {
  const req = { method, body, headers, query }
  let status = 200
  let payload = undefined
  const res = {
    status(code) { status = code; return this },
    json(obj) { payload = obj; return obj },
    _get() { return { status, payload } }
  }
  return { req, res }
}

let user

beforeAll(async () => {
  const email = `test.user+${Date.now()}@example.com`
  user = await prisma.user.create({ data: { name: 'Test User', email, password: 'secret', role: 'ADMIN' } })
})

afterAll(async () => {
  if (user) await prisma.user.delete({ where: { id: user.id } })
  await prisma.$disconnect()
})

test('GET /api/donors supports q search and pagination', async () => {
  const token = signToken({ userId: user.id })
  // create 3 donors with names that allow searching
  const base = `autotest+${Date.now()}`
  const d1 = await prisma.donor.create({ data: { firstName: 'Alice', lastName: 'Auto', email: `${base}.alice@example.com` } })
  const d2 = await prisma.donor.create({ data: { firstName: 'Alicia', lastName: 'Auto', email: `${base}.alicia@example.com` } })
  const d3 = await prisma.donor.create({ data: { firstName: 'Bob', lastName: 'Auto', email: `${base}.bob@example.com` } })

  try {
    const { req, res } = createReqRes({ method: 'GET', headers: { authorization: `Bearer ${token}` }, query: { q: 'Ali', page: '1', pageSize: '10' } })
    await donorsIndex(req, res)
    const out = res._get()
    expect(out.status).toBe(200)
    expect(out.payload).toHaveProperty('donors')
    const emails = out.payload.donors.map(d => d.email)
    expect(emails).toContain(`${base}.alice@example.com`)
    expect(emails).toContain(`${base}.alicia@example.com`)
    expect(out.payload.total).toBeGreaterThanOrEqual(2)
  } finally {
    // cleanup
    await prisma.donor.deleteMany({ where: { email: { contains: base } } })
  }
})

test('POST /api/donors ignores unknown address fields and creates donor', async () => {
  const token = signToken({ userId: user.id })
  const email = `donor+createcheck+${Date.now()}@example.com`
  const body = { firstName: 'Create', lastName: 'Check', email, city: 'Nowhere', state: 'NA', zipcode: '00000' }
  const { req, res } = createReqRes({ method: 'POST', headers: { authorization: `Bearer ${token}` }, body })
  await donorsIndex(req, res)
  const out = res._get()
  expect(out.status).toBe(201)
  expect(out.payload).toHaveProperty('donor')
  expect(out.payload.donor.email).toBe(email)
  // ensure response doesn't include unknown fields
  expect(out.payload.donor).not.toHaveProperty('city')
  expect(out.payload.donor).not.toHaveProperty('state')
  expect(out.payload.donor).not.toHaveProperty('zipcode')

  // cleanup
  await prisma.donor.deleteMany({ where: { email } })
})
