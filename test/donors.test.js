import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { beforeAll, afterAll, test, expect } from 'vitest'
import { PrismaClient } from '@prisma/client'
import donorsIndex from '../pages/api/donors/index'
import donorDetail from '../pages/api/donors/[id]'
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

test('create, update, delete donor', async () => {
  const token = signToken({ userId: user.id })
  const { req: r1, res: s1 } = createReqRes({ method: 'POST', body: { firstName: 'Donor', lastName: 'Test', email: `donor+${Date.now()}@example.com` }, headers: { authorization: `Bearer ${token}` } })
  await donorsIndex(r1, s1)
  const out1 = s1._get()
  expect(out1.status).toBe(201)
  const donor = out1.payload.donor

  // update
  const { req: r2, res: s2 } = createReqRes({ method: 'PUT', body: { firstName: 'DonorX' }, headers: { authorization: `Bearer ${token}` }, query: { id: donor.id } })
  await donorDetail(r2, s2)
  const out2 = s2._get()
  expect(out2.status).toBe(200)
  expect(out2.payload.donor.firstName).toBe('DonorX')

  // delete
  const { req: r3, res: s3 } = createReqRes({ method: 'DELETE', headers: { authorization: `Bearer ${token}` }, query: { id: donor.id } })
  await donorDetail(r3, s3)
  const out3 = s3._get()
  expect(out3.status).toBe(200)
  const db = await prisma.donor.findUnique({ where: { id: donor.id } })
  expect(db.active).toBe(false)
})
