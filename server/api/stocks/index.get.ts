// GET /api/stocks — 내 종목 목록 조회
// ====================================
// 로그인한 유저의 종목만 보여줌

export default defineEventHandler(async (event) => {
  // requireAuth() → 로그인 안 했으면 여기서 401 에러 발생
  const user = await requireAuth(event)

  const stocks = await prisma.stock.findMany({
    where: { userId: user.id },  // 하드코딩 → 로그인 유저로 변경!
    orderBy: { createdAt: 'desc' }
  })

  return stocks
})
