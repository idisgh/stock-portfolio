// GET /api/health — DB 연결 확인용
export default defineEventHandler(async () => {
  // 환경변수 디버깅 (배포 후 삭제)
  const envKeys = Object.keys(process.env)
    .filter(k => k.includes('DATABASE') || k.includes('POSTGRES') || k.includes('NEON'))
    .sort()

  const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_POSTGRES_URL || process.env.DATABASE_URL_POSTGRES_URL
  
  try {
    const count = await prisma.user.count()
    return { ok: true, userCount: count, envKeys }
  } catch (e: any) {
    return { ok: false, error: e.message, envKeys, hasDbUrl: !!dbUrl, dbUrlPrefix: dbUrl?.substring(0, 20) }
  }
})
