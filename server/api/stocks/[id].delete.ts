// DELETE /api/stocks/:id — 종목 삭제

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))

  // 내 종목인지 확인
  const existing = await prisma.stock.findFirst({
    where: { id, userId: user.id }
  })
  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: '해당 종목을 찾을 수 없습니다'
    })
  }

  await prisma.stock.delete({ where: { id } })

  return { message: '삭제되었습니다', id }
})
