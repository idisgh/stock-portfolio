// GET /api/history?ticker=AAPL&period=3mo — 주가 히스토리
// ======================================================
// 차트에 필요한 OHLCV 데이터를 Yahoo Finance에서 가져옴
// OHLCV = Open(시가), High(고가), Low(저가), Close(종가), Volume(거래량)

import YahooFinance from 'yahoo-finance2'

const yf = new YahooFinance()

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const ticker = String(query.ticker || '')
  const period = String(query.period || '3mo') // 기본 3개월

  if (!ticker) {
    throw createError({ statusCode: 400, statusMessage: 'ticker가 필요합니다' })
  }

  // period → 시작 날짜 계산
  const now = new Date()
  const periodMap: Record<string, number> = {
    '1mo': 30,
    '3mo': 90,
    '6mo': 180,
    '1y': 365,
    '2y': 730,
    '5y': 1825,
  }
  const days = periodMap[period] || 90
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  try {
    const result = await yf.chart(ticker, {
      period1: startDate,
      period2: now,
      interval: days > 365 ? '1wk' : '1d',  // 1년 이상이면 주봉, 아니면 일봉
    })

    // lightweight-charts 형식으로 변환
    const candles = result.quotes.map((q: any) => ({
      time: q.date.toISOString().split('T')[0],  // "2026-01-15"
      open: q.open,
      high: q.high,
      low: q.low,
      close: q.close,
      volume: q.volume,
    })).filter((c: any) => c.open && c.close)  // 빈 데이터 제거

    return {
      ticker,
      period,
      candles,
    }
  } catch (e) {
    throw createError({ statusCode: 500, statusMessage: `${ticker} 히스토리 조회 실패` })
  }
})
