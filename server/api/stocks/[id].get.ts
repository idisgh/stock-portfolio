// GET /api/stocks/:id — 종목 상세 조회

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))

  const stock = await prisma.stock.findFirst({
    where: { id, userId: user.id }
  })

  if (!stock) {
    throw createError({ statusCode: 404, statusMessage: '종목을 찾을 수 없습니다' })
  }

  return stock
})
