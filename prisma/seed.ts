// prisma/seed.ts
// ===============
// DB에 테스트 데이터를 넣는 스크립트.

import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../generated/prisma/client.js'

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db'
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const hashedPassword = await bcrypt.hash('test1234', 10)

  const user = await prisma.user.upsert({
    where: { email: 'test@test.com' },
    update: { password: hashedPassword },
    create: {
      email: 'test@test.com',
      password: hashedPassword,
      name: '테스트유저',
    }
  })

  await prisma.stock.createMany({
    data: [
      {
        ticker: 'AAPL',
        name: '애플',
        buyPrice: 230.50,
        quantity: 10,
        buyDate: new Date('2026-01-15'),
        userId: user.id,
      },
      {
        ticker: '005930.KS',
        name: '삼성전자',
        buyPrice: 55000,
        quantity: 100,
        buyDate: new Date('2026-02-01'),
        userId: user.id,
      }
    ],
  })

  console.log('✅ 시드 데이터 생성 완료!')
  console.log(`   유저: ${user.email}`)
  console.log(`   종목: AAPL, 005930.KS`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
