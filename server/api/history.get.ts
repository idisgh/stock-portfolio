// GET /api/history?ticker=AAPL&range=3mo&interval=1d
// ======================================================
// 차트에 필요한 OHLCV 데이터를 Yahoo Finance에서 가져옴
// OHLCV = Open(시가), High(고가), Low(저가), Close(종가), Volume(거래량)
//
// interval 지원:
//   5m  → 최근 1일 (주말이면 마지막 거래일 자동 처리)
//   1h  → 최근 5일
//   1d  → 일봉 (최대 2년)
//   1wk → 주봉 (2년 이상)

import YahooFinance from 'yahoo-finance2'

const yf = new YahooFinance()

// range → fetch 시 사용할 날짜 범위 (일 단위)
// 1d는 주말 대비 7일치 요청 후 마지막 거래일만 필터링
const fetchDaysMap: Record<string, number> = {
  '1d':  7,    // 주말/공휴일 대비 여유 있게 7일, 이후 마지막 거래일만 추출
  '5d':  7,
  '1mo': 35,
  '3mo': 95,
  '6mo': 185,
  '1y':  370,
  '2y':  735,
  '5y':  1830,
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
  return ['1m','2m','5m','15m','30m','60m','1h'].includes(interval)
}

// Unix timestamp(초) → "YYYY-MM-DD" 변환
function toDateStr(ts: number) {
  return new Date(ts * 1000).toISOString().split('T')[0]
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const ticker = String(query.ticker || '')
  const range    = String(query.range || query.period || '3mo')
  const interval = String(query.interval || defaultIntervalMap[range] || '1d')

  if (!ticker) {
    throw createError({ statusCode: 400, statusMessage: 'ticker가 필요합니다' })
  }

  const days = fetchDaysMap[range] ?? 95
  const now  = new Date()
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  const intraday  = isIntraday(interval)

  try {
    const result = await yf.chart(ticker, {
      period1:  startDate,
      period2:  now,
      interval: interval as any,
    })

    let candles = result.quotes
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

    // 1d range: 가장 마지막 거래일 데이터만 추출
    if (range === '1d' && intraday && candles.length > 0) {
      const lastDate = toDateStr(candles[candles.length - 1].time as number)
      candles = candles.filter(c => toDateStr(c.time as number) === lastDate)
    }

    return { ticker, range, interval, intraday, candles }
  } catch (e) {
    throw createError({ statusCode: 500, statusMessage: `${ticker} 히스토리 조회 실패` })
  }
})
