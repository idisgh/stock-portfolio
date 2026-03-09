// POST /api/auth/register — 회원가입
// ====================================
// 1. 이메일 중복 체크
// 2. 비밀번호 해싱 (평문 → 암호화)
// 3. DB에 저장
// 4. 세션 쿠키 발급 (가입 즉시 로그인 상태)

import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // 필수 필드 검증
  if (!body.email || !body.password || !body.name) {
    throw createError({
      statusCode: 400,
      statusMessage: '이메일, 비밀번호, 이름은 필수입니다'
    })
  }

  // 이메일 중복 체크
  const existing = await prisma.user.findUnique({
    where: { email: body.email }
  })
  if (existing) {
    throw createError({
      statusCode: 409,  // 409 Conflict
      statusMessage: '이미 가입된 이메일입니다'
    })
  }

  // 비밀번호 해싱
  // bcrypt.hash(원본, 10) → 10은 "salt rounds" (높을수록 안전하지만 느림)
  // salt = 해시에 섞는 랜덤 값 (같은 비밀번호도 매번 다른 해시 생성)
  const hashedPassword = await bcrypt.hash(body.password, 10)

  // DB에 저장 (해시된 비밀번호로!)
  const user = await prisma.user.create({
    data: {
      email: body.email,
      password: hashedPassword,
      name: body.name,
    }
  })

  // 세션 쿠키 설정
  // 쿠키 = 브라우저에 저장되는 작은 데이터. 요청마다 자동으로 서버에 전송됨.
  setCookie(event, 'session', String(user.id), {
    httpOnly: true,   // JavaScript로 접근 불가 (XSS 방어)
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,  // 7일 유지
    path: '/',
  })

  // 비밀번호는 응답에서 제외!
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  }
})
