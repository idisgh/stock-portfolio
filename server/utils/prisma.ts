// server/utils/prisma.ts
// Prisma 7 + Neon — lazy 초기화 (서버리스 환경변수 타이밍 대응)

import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'
import { PrismaClient } from '~~/generated/prisma/client.js'

let _prisma: PrismaClient | null = null

function getPrisma(): PrismaClient {
  if (!_prisma) {
    const connectionString = process.env.DATABASE_URL
      || process.env.DATABASE_URL_POSTGRES_URL
      || process.env.DATABASE_POSTGRES_URL

    if (!connectionString) {
      throw new Error('DATABASE_URL is not set')
    }

    const pool = new Pool({ connectionString })
    const adapter = new PrismaNeon(pool)
    _prisma = new PrismaClient({ adapter })
  }
  return _prisma
}

// Proxy로 감싸서 기존 코드에서 prisma.xxx 호출 시 lazy 초기화
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrisma() as any)[prop]
  }
})
