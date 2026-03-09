// GET /api/search?q=삼성 — 종목 검색 (자동완성용)
// Yahoo Finance는 한글 검색 불가 → 한글이면 로컬 한국 종목 DB에서 검색

import YahooFinance from 'yahoo-finance2'
import krStocksData from '../data/kr-stocks.json'

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

// 한국 종목 리스트 (110개+)
const krStocks = krStocksData.map((s: any) => ({ ticker: s.t, name: s.n }))

function isKorean(str: string) {
  return /[\uAC00-\uD7AF]/.test(str)
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = String(query.q || '').trim()

  if (!q || q.length < 1) return []

  // 한글이면 로컬 한국 종목에서 검색
  if (isKorean(q)) {
    return krStocks
      .filter(s => s.name.includes(q))
      .slice(0, 8)
      .map(s => ({ ticker: s.ticker, name: s.name, exchange: 'KRX', type: 'KR' }))
  }

  // 영문인데 .KS/.KQ 패턴이면 한국 종목에서도 검색
  const upperQ = q.toUpperCase()
  const krMatches = krStocks
    .filter(s => s.ticker.toUpperCase().includes(upperQ) || s.name.toUpperCase().includes(upperQ))
    .slice(0, 3)
    .map(s => ({ ticker: s.ticker, name: s.name, exchange: 'KRX', type: 'KR' as string }))

  // Yahoo Finance 검색 (영문)
  let yfResults: any[] = []
  try {
    const result = await yf.search(q, { quotesCount: 8, newsCount: 0 })
    yfResults = (result.quotes || [])
      .filter((item: any) => item.quoteType === 'EQUITY')
      .map((item: any) => ({
        ticker: item.symbol,
        name: item.shortname || item.longname || item.symbol,
        exchange: item.exchange,
        type: item.symbol.includes('.KS') || item.symbol.includes('.KQ') ? 'KR' : 'US',
      }))
  } catch {}

  // 합치고 중복 제거
  const seen = new Set<string>()
  const combined = [...krMatches, ...yfResults].filter(item => {
    if (seen.has(item.ticker)) return false
    seen.add(item.ticker)
    return true
  })

  return combined.slice(0, 8)
})
