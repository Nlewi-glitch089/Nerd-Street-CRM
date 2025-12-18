import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

export function getPrisma() {
  // Ensure .env.local is loaded for test harnesses that don't run dotenv early
  try { dotenv.config({ path: '.env.local' }) } catch (e) {}
  if (!global.__prisma) {
    global.__prisma = new PrismaClient()
  }
  return global.__prisma
}

export default getPrisma
