// server/utils/prisma.ts
// =====================
// Prisma 7에서는 "어댑터" 패턴을 씀.
// 어댑터 = DB 드라이버를 Prisma에 연결해주는 중간 다리
// SQLite를 쓰니까 better-sqlite3 어댑터 사용.

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../../generated/prisma/client.js'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL || 'file:./prisma/dev.db'
  })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
