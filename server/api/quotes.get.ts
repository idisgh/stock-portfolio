// GET /api/quotes?tickers=AAPL,005930.KS — 현재가 일괄 조회
// ============================================================
// Yahoo Finance v3에서는 인스턴스를 먼저 만들어야 함

import YahooFinance from 'yahoo-finance2'

const yf = new YahooFinance()

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const tickers = String(query.tickers || '').split(',').filter(Boolean)

  if (!tickers.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'tickers 파라미터가 필요합니다'
    })
  }

  const results = await Promise.allSettled(
    tickers.map(async (ticker) => {
      try {
        const quote = await yf.quote(ticker)
        return {
          ticker,
          currentPrice: quote.regularMarketPrice ?? 0,
          previousClose: quote.regularMarketPreviousClose ?? 0,
          change: quote.regularMarketChange ?? 0,
          changePercent: quote.regularMarketChangePercent ?? 0,
          currency: quote.currency ?? 'USD',
          marketState: quote.marketState ?? 'CLOSED',
        }
      } catch {
        return { ticker, error: '조회 실패' }
      }
    })
  )

  const quotes: Record<string, any> = {}
  for (const result of results) {
    if (result.status === 'fulfilled') {
      quotes[result.value.ticker] = result.value
    }
  }

  return quotes
})
