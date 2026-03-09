// POST /api/auth/logout — 로그아웃
// ==================================
// 세션 쿠키를 삭제하면 끝!

export default defineEventHandler(async (event) => {
  // 쿠키 삭제 = maxAge를 0으로 설정
  deleteCookie(event, 'session', { path: '/' })
  return { message: '로그아웃되었습니다' }
})
