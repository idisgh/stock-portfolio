// GET /api/health — DB 연결 확인용
export default defineEventHandler(async () => {
  try {
    const count = await prisma.user.count()
    return { ok: true, userCount: count, env: !!process.env.DATABASE_URL }
  } catch (e: any) {
    return { ok: false, error: e.message, env: !!process.env.DATABASE_URL }
  }
})
