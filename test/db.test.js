import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { afterAll, test, expect } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

afterAll(async () => {
  await prisma.$disconnect()
})

test('Prisma can connect and run a simple query', async () => {
  // This runs a simple SELECT 1 to verify connectivity
  const res = await prisma.$queryRaw`SELECT 1 AS result`
  // res is an array of rows for Postgres
  const first = Array.isArray(res) ? res[0] : res
  const val = first?.result ?? Object.values(first ?? {})[0]
  expect(Number(val)).toBe(1)
})
