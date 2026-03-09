// GET /api/sparkline?tickers=AAPL,005930.KS — 주간 종가 데이터 (스파크라인용)

import YahooFinance from 'yahoo-finance2'

const yf = new YahooFinance()

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const tickers = String(query.tickers || '').split(',').filter(Boolean)

  if (!tickers.length) return {}

  const now = new Date()
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const results = await Promise.allSettled(
    tickers.map(async (ticker) => {
      try {
        const data = await yf.chart(ticker, {
          period1: twoWeeksAgo,
          period2: now,
          interval: '1d',
        })
        const closes = data.quotes
          .map((q: any) => q.close)
          .filter((v: any) => v != null)
        return { ticker, closes }
      } catch {
        return { ticker, closes: [] }
      }
    })
  )

  const sparklines: Record<string, number[]> = {}
  for (const r of results) {
    if (r.status === 'fulfilled') {
      sparklines[r.value.ticker] = r.value.closes
    }
  }

  return sparklines
})
