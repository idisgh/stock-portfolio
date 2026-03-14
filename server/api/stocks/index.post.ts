// POST /api/stocks — 종목 추가

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)

  if (!body.ticker || !body.name || !body.buyPrice || !body.quantity) {
    throw createError({
      statusCode: 400,
      statusMessage: '필수 항목이 누락되었습니다: ticker, name, buyPrice, quantity'
    })
  }

  const stock = await prisma.stock.create({
    data: {
      ticker: body.ticker,
      name: body.name,
      buyPrice: Number(body.buyPrice),
      quantity: Number(body.quantity),
      buyDate: body.buyDate ? new Date(body.buyDate) : new Date(),
      platform: body.platform || null,
      tradeType: body.tradeType || '현금',
      memo: body.memo || null,
      userId: user.id  // 로그인한 유저!
    }
  })

  return stock
})
