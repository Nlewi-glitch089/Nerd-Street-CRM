import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { beforeAll, afterAll, test, expect } from 'vitest'
import { PrismaClient } from '@prisma/client'
import eventsIndex from '../pages/api/events/index'
import eventDetail from '../pages/api/events/[id]'
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

let adminUser

beforeAll(async () => {
  const email = `test.admin+${Date.now()}@example.com`
  adminUser = await prisma.user.create({ data: { name: 'Admin', email, password: 'secret', role: 'ADMIN' } })
})

afterAll(async () => {
  if (adminUser) await prisma.user.delete({ where: { id: adminUser.id } })
  await prisma.$disconnect()
})

test('create, update, delete event', async () => {
  const token = signToken({ userId: adminUser.id })
  const { req: r1, res: s1 } = createReqRes({ method: 'POST', body: { title: 'Test Event', description: 'desc' }, headers: { authorization: `Bearer ${token}` } })
  await eventsIndex(r1, s1)
  const out1 = s1._get()
  expect(out1.status).toBe(201)
  const ev = out1.payload.event

  const { req: r2, res: s2 } = createReqRes({ method: 'PUT', body: { title: 'Updated Event' }, headers: { authorization: `Bearer ${token}` }, query: { id: ev.id } })
  await eventDetail(r2, s2)
  const out2 = s2._get()
  expect(out2.status).toBe(200)
  expect(out2.payload.event.title).toBe('Updated Event')

  const { req: r3, res: s3 } = createReqRes({ method: 'DELETE', headers: { authorization: `Bearer ${token}` }, query: { id: ev.id } })
  await eventDetail(r3, s3)
  const out3 = s3._get()
  expect(out3.status).toBe(200)
  const db = await prisma.event.findUnique({ where: { id: ev.id } })
  expect(db.active).toBe(false)
})
