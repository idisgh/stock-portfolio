// GET /api/exchange-rate — 현재 USD/KRW 환율 조회
// Yahoo Finance에서 USDKRW=X 시세로 가져옴

import YahooFinance from 'yahoo-finance2'

const yf = new YahooFinance()

let cached = { rate: 1450, updatedAt: 0 }

export default defineEventHandler(async () => {
  // 5분 캐시 (너무 자주 호출 방지)
  const now = Date.now()
  if (now - cached.updatedAt < 5 * 60 * 1000) {
    return cached
  }

  try {
    const quote = await yf.quote('USDKRW=X')
    cached = {
      rate: quote.regularMarketPrice ?? 1450,
      updatedAt: now,
    }
  } catch {
    // 실패하면 캐시된 값 유지
  }

  return cached
})
