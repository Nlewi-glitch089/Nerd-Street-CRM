import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = global.__prisma || new PrismaClient()
if (!global.__prisma) global.__prisma = prisma

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const JWT_EXPIRES_IN = '7d'

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return null
  }
}

export async function getUserFromToken(token) {
  const data = verifyToken(token)
  if (!data || !data.userId) return null
  const user = await prisma.user.findUnique({ where: { id: data.userId } })
  return user
}
