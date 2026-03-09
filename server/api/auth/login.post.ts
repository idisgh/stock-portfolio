// POST /api/auth/login — 로그인
// ================================
// 1. 이메일로 유저 찾기
// 2. 비밀번호 비교 (입력값 해시 vs DB 해시)
// 3. 세션 쿠키 발급

import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.email || !body.password) {
    throw createError({
      statusCode: 400,
      statusMessage: '이메일과 비밀번호를 입력해주세요'
    })
  }

  // 이메일로 유저 찾기
  const user = await prisma.user.findUnique({
    where: { email: body.email }
  })

  if (!user) {
    throw createError({
      statusCode: 401,  // 401 Unauthorized
      statusMessage: '이메일 또는 비밀번호가 틀렸습니다'
    })
  }

  // bcrypt.compare() = 입력된 비밀번호를 해싱해서 DB값과 비교
  // "mypassword123" → 해시 → DB의 "$2b$10$xK3f..."와 같은지 확인
  const isValid = await bcrypt.compare(body.password, user.password)

  if (!isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: '이메일 또는 비밀번호가 틀렸습니다'
    })
    // ⚠️ "비밀번호가 틀렸습니다"라고 구체적으로 안 알려줌
    // → 해커에게 "이메일은 맞다"는 힌트를 주지 않기 위해
  }

  // 세션 쿠키 발급
  setCookie(event, 'session', String(user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  }
})
