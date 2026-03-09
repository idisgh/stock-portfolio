// server/utils/auth.ts
// ====================
// 인증 관련 유틸 함수
// "이 요청을 보낸 사람이 누구인지" 확인하는 헬퍼

import type { H3Event } from 'h3'

// 쿠키에서 로그인 유저 ID를 추출하는 함수
export async function getUserFromSession(event: H3Event) {
  const sessionId = getCookie(event, 'session')

  if (!sessionId) return null

  const user = await prisma.user.findUnique({
    where: { id: Number(sessionId) }
  })

  return user
}

// 로그인 필수 체크 — 미로그인이면 401 에러
export async function requireAuth(event: H3Event) {
  const user = await getUserFromSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: '로그인이 필요합니다'
    })
  }

  return user
}
