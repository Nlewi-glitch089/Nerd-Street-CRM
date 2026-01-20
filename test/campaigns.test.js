import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { beforeAll, afterAll, test, expect } from 'vitest'
import { PrismaClient } from '@prisma/client'
import campaignsHandler from '../pages/api/campaigns/index'
import campaignDetailHandler from '../pages/api/campaigns/[id]'
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

test('create, update, delete campaign', async () => {
  const token = signToken({ userId: adminUser.id })
  // create
  const { req: r1, res: s1 } = createReqRes({ method: 'POST', body: { name: 'Temporary Test Campaign', goal: 5000 }, headers: { authorization: `Bearer ${token}` } })
  await campaignsHandler(r1, s1)
  const out1 = s1._get()
  expect(out1.status).toBe(201)
  expect(out1.payload).toHaveProperty('campaign')
  const camp = out1.payload.campaign

  // update
  const { req: r2, res: s2 } = createReqRes({ method: 'PUT', body: { goal: 7500 }, headers: { authorization: `Bearer ${token}` }, query: { id: camp.id } })
  await campaignDetailHandler(r2, s2)
  const out2 = s2._get()
  expect(out2.status).toBe(200)
  expect(out2.payload.campaign.goal).toBe(7500)

  // delete
  const { req: r3, res: s3 } = createReqRes({ method: 'DELETE', headers: { authorization: `Bearer ${token}` }, query: { id: camp.id } })
  await campaignDetailHandler(r3, s3)
  const out3 = s3._get()
  expect(out3.status).toBe(200)
  // verify soft-delete flag
  const db = await prisma.campaigns.findUnique({ where: { id: camp.id } })
  expect(db.active).toBe(false)
})
