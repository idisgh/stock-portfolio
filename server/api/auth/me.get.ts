// GET /api/auth/me — 현재 로그인한 유저 정보
// =============================================
// 쿠키에서 세션 ID를 읽어 → DB에서 유저 조회
// 프론트엔드가 "지금 로그인 상태인가?" 확인할 때 호출

export default defineEventHandler(async (event) => {
  // 쿠키에서 session 값 읽기
  const sessionId = getCookie(event, 'session')

  if (!sessionId) {
    throw createError({
      statusCode: 401,
      statusMessage: '로그인이 필요합니다'
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(sessionId) }
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: '유효하지 않은 세션입니다'
    })
  }

  // 비밀번호 제외하고 반환
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  }
})
