// server/utils/prisma.ts
// =====================
// Prisma 7 어댑터 패턴: Neon (서버리스 PostgreSQL) 사용
// Vercel 서버리스 환경에서도 WebSocket으로 DB 연결 가능

import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaClient } from '~~/generated/prisma/client.js'

// Vercel 서버리스에서 WebSocket 필요
neonConfig.useSecureWebSocket = true

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaNeon(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
