// server/utils/prisma.ts
// Prisma 7 + PostgreSQL (pg 어댑터)

import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { PrismaClient } from '~~/generated/prisma/client.js'

let _prisma: PrismaClient | null = null

function getPrisma(): PrismaClient {
  if (!_prisma) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL not set')

    const pool = new pg.Pool({ connectionString: url })
    const adapter = new PrismaPg(pool)
    _prisma = new PrismaClient({ adapter })
  }
  return _prisma
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrisma() as any)[prop]
  }
})
