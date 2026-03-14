// GET /api/history?ticker=AAPL&range=3mo&interval=1d
// ======================================================
// 차트에 필요한 OHLCV 데이터를 Yahoo Finance에서 가져옴
// OHLCV = Open(시가), High(고가), Low(저가), Close(종가), Volume(거래량)
//
// interval 지원:
//   5m  → 최근 1일 이내만 유효
//   1h  → 최근 5일 이내만 유효
//   1d  → 일봉 (최대 2년)
//   1wk → 주봉 (2년 이상)

import YahooFinance from 'yahoo-finance2'

const yf = new YahooFinance()

// range → 날짜 계산 (일 단위)
const rangeMap: Record<string, number> = {
  '1d':  1,
  '5d':  5,
  '1mo': 30,
  '3mo': 90,
  '6mo': 180,
  '1y':  365,
  '2y':  730,
  '5y':  1825,
}

// range 기본 interval (명시 없을 때)
const defaultIntervalMap: Record<string, string> = {
  '1d':  '5m',
  '5d':  '1h',
  '1mo': '1d',
  '3mo': '1d',
  '6mo': '1d',
  '1y':  '1d',
  '2y':  '1wk',
  '5y':  '1wk',
}

// interval이 분/시간인지 여부
function isIntraday(interval: string) {
  return interval === '1m' || interval === '2m' || interval === '5m' ||
         interval === '15m' || interval === '30m' || interval === '60m' || interval === '1h'
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const ticker = String(query.ticker || '')

  // 하위 호환: period 파라미터도 range로 취급
  const range = String(query.range || query.period || '3mo')
  const interval = String(query.interval || defaultIntervalMap[range] || '1d')

  if (!ticker) {
    throw createError({ statusCode: 400, statusMessage: 'ticker가 필요합니다' })
  }

  const days = rangeMap[range] ?? 90
  const now = new Date()
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  try {
    const result = await yf.chart(ticker, {
      period1: startDate,
      period2: now,
      interval: interval as any,
    })

    const intraday = isIntraday(interval)

    // lightweight-charts 형식으로 변환
    // - 일봉/주봉: "YYYY-MM-DD" 문자열
    // - 분봉/시간봉: Unix timestamp (초)
    const candles = result.quotes
      .filter((q: any) => q.open != null && q.close != null)
      .map((q: any) => ({
        time: intraday
          ? Math.floor(new Date(q.date).getTime() / 1000)
          : new Date(q.date).toISOString().split('T')[0],
        open:   q.open,
        high:   q.high,
        low:    q.low,
        close:  q.close,
        volume: q.volume ?? 0,
      }))

    return { ticker, range, interval, intraday, candles }
  } catch (e) {
    throw createError({ statusCode: 500, statusMessage: `${ticker} 히스토리 조회 실패` })
  }
})
