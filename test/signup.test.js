import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock bcryptjs before importing the handler so the real module is not required
// Return a default export object so `import bcrypt from 'bcryptjs'` works in handlers
vi.mock('bcryptjs', () => ({ default: { hash: async (s, r) => `hashed:${s}` } }))

// Mock Prisma client singleton used in the handler.
// Use a hoisted mock (vi.mock) but expose the internal mock to the test via a global
vi.mock('@prisma/client', () => {
  const mockCreateInternal = vi.fn()
  // attach to global so the test can inspect/reset it after module import
  global.__mockCreate = mockCreateInternal
  return {
    PrismaClient: function() {
      return { user: { create: mockCreateInternal } }
    }
  }
})

import handler from '../pages/api/auth/signup'

// use the mock created by the mocked module
const mockCreate = global.__mockCreate

function makeReq(body) {
  return { method: 'POST', body }
}

function makeRes() {
  const res = {}
  res.status = (code) => { res.statusCode = code; return res }
  res.json = (payload) => { res.payload = payload; return res }
  return res
}

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    mockCreate.mockReset()
  })

  it('rejects non-nerdstgamers.com emails', async () => {
    const req = makeReq({ name: 'Sally Rone', email: 'sally@example.com', password: 'password123' })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(400)
    expect(res.payload).toHaveProperty('error')
    expect(String(res.payload.error)).toMatch(/@nerdstgamers.com/)
  })

  it('rejects bad local part', async () => {
    const req = makeReq({ name: 'Sally Rone', email: 'Sally+tag@nerdstgamers.com', password: 'password123' })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(400)
    expect(res.payload).toHaveProperty('error')
  })

  it('rejects short passwords', async () => {
    const req = makeReq({ name: 'Sally Rone', email: 'sally@nerdstgamers.com', password: 'short' })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(400)
    expect(res.payload).toHaveProperty('error')
  })

  it('creates user with hashed password for valid input', async () => {
    mockCreate.mockResolvedValue({ id: 42 })
    const req = makeReq({ name: 'Sally Rone', email: 'sally.rone@nerdstgamers.com', password: 'password123' })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(201)
    expect(res.payload).toEqual({ ok: true, id: 42 })
    expect(mockCreate).toHaveBeenCalled()
    const created = mockCreate.mock.calls[0][0]
    expect(created).toHaveProperty('data')
    expect(created.data.email).toBe('sally.rone@nerdstgamers.com')
    expect(created.data.password).toMatch(/^hashed:/)
  })
})
