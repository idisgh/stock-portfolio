// GET /api/health — DB 연결 확인
export default defineEventHandler(async () => {
  try {
    const count = await prisma.user.count()
    return { ok: true, userCount: count }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
})
