// PUT /api/stocks/:id — 종목 수정

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  // 내 종목인지 확인 (다른 유저 종목 수정 방지!)
  const existing = await prisma.stock.findFirst({
    where: { id, userId: user.id }
  })
  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: '해당 종목을 찾을 수 없습니다'
    })
  }

  const stock = await prisma.stock.update({
    where: { id },
    data: {
      ticker: body.ticker ?? existing.ticker,
      name: body.name ?? existing.name,
      buyPrice: body.buyPrice ? Number(body.buyPrice) : existing.buyPrice,
      quantity: body.quantity ? Number(body.quantity) : existing.quantity,
      buyDate: body.buyDate ? new Date(body.buyDate) : existing.buyDate,
      platform: body.platform !== undefined ? body.platform : existing.platform,
      tradeType: body.tradeType !== undefined ? body.tradeType : existing.tradeType,
      memo: body.memo !== undefined ? body.memo : existing.memo
    }
  })

  return stock
})
