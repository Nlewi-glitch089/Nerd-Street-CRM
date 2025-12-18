import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { beforeAll, afterAll, test, expect } from 'vitest'
import { PrismaClient } from '@prisma/client'
import loginHandler from '../pages/api/auth/login'
import protectedHandler from '../pages/api/protected'

const prisma = new PrismaClient()

function createReqRes({ method = 'GET', body = undefined, headers = {} } = {}) {
  const req = { method, body, headers }
  let status = 200
  let payload = undefined
  const res = {
    status(code) { status = code; return this },
    json(obj) { payload = obj; return obj },
    _get() { return { status, payload } }
  }
  return { req, res }
}

let testUser

beforeAll(async () => {
  // ensure a fresh test user
  const email = `test.user+${Date.now()}@example.com`
  testUser = await prisma.user.create({ data: { name: 'Test User', email, password: 'secret123', role: 'TEAM_MEMBER' } })
})

afterAll(async () => {
  if (testUser) await prisma.user.delete({ where: { id: testUser.id } })
  await prisma.$disconnect()
})

test('protected endpoint rejects when no token provided', async () => {
  const { req, res } = createReqRes({ method: 'GET', headers: {} })
  await protectedHandler(req, res)
  const out = res._get()
  expect(out.status).toBe(401)
  expect(out.payload).toHaveProperty('error')
})

test('login then access protected endpoint', async () => {
  // call login
  const { req: r1, res: s1 } = createReqRes({ method: 'POST', body: { email: testUser.email, password: 'secret123' } })
  await loginHandler(r1, s1)
  const loginOut = s1._get()
  expect(loginOut.status).toBe(201)
  expect(loginOut.payload).toHaveProperty('token')
  const token = loginOut.payload.token

  // call protected with token
  const { req: r2, res: s2 } = createReqRes({ method: 'GET', headers: { authorization: `Bearer ${token}` } })
  await protectedHandler(r2, s2)
  const protectedOut = s2._get()
  expect(protectedOut.status).toBe(200)
  expect(protectedOut.payload).toHaveProperty('user')
  expect(protectedOut.payload.user.email).toBe(testUser.email)
})
