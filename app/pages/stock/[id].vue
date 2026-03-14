<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <header class="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
      <button @click="navigateTo('/')" class="flex items-center gap-1 text-gray-400 hover:text-white transition">
        <ArrowLeft :size="16" /> 뒤로
      </button>
      <h1 class="text-xl font-bold" v-if="stock">{{ stock.name }} ({{ stock.ticker }})</h1>
    </header>

    <main class="max-w-4xl mx-auto p-6" v-if="stock">
      <!-- 종목 정보 카드 (합산 기준) -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-gray-800 rounded-xl p-4">
          <div class="text-gray-400 text-sm">현재가</div>
          <div class="text-xl font-bold mt-1">
            {{ quote ? formatPrice(quote.currentPrice) : '-' }}
          </div>
          <div v-if="quote" class="text-sm mt-1"
            :class="quote.changePercent >= 0 ? 'text-red-400' : 'text-blue-400'">
            {{ quote.changePercent >= 0 ? '▲' : '▼' }}
            {{ Math.abs(quote.changePercent).toFixed(2) }}%
          </div>
        </div>
        <div class="bg-gray-800 rounded-xl p-4">
          <div class="text-gray-400 text-sm">평균단가 <span v-if="groupStocks.length > 1" class="text-xs text-gray-500">({{ groupStocks.length }}건 평균)</span></div>
          <div class="text-xl font-bold mt-1">{{ formatPrice(avgBuyPrice) }}</div>
        </div>
        <div class="bg-gray-800 rounded-xl p-4">
          <div class="text-gray-400 text-sm">수익률</div>
          <div class="text-xl font-bold mt-1"
            :class="profitRate >= 0 ? 'text-red-400' : 'text-blue-400'">
            {{ profitRate >= 0 ? '+' : '' }}{{ profitRate.toFixed(2) }}%
          </div>
        </div>
        <div class="bg-gray-800 rounded-xl p-4">
          <div class="text-gray-400 text-sm">평가손익</div>
          <div class="text-xl font-bold mt-1"
            :class="profit >= 0 ? 'text-red-400' : 'text-blue-400'">
            {{ profit >= 0 ? '+' : '' }}{{ formatPrice(profit) }}
          </div>
        </div>
      </div>

      <!-- 보유 정보 (합산 기준) -->
      <div class="bg-gray-800 rounded-xl p-6 mb-6">
        <h2 class="text-lg font-semibold mb-3">보유 정보</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="text-gray-400">총 수량</span>
            <div class="font-mono mt-1">{{ totalQuantity }}주</div>
          </div>
          <div>
            <span class="text-gray-400">투자금액</span>
            <div class="font-mono mt-1">{{ formatPrice(avgBuyPrice * totalQuantity) }}</div>
          </div>
          <div>
            <span class="text-gray-400">평가금액</span>
            <div class="font-mono mt-1">{{ formatPrice(currentValue) }}</div>
          </div>
          <div>
            <span class="text-gray-400">거래유형</span>
            <div class="mt-1">
              <span :class="(stock as any).tradeType === '신용'
                ? 'bg-orange-500/20 text-orange-400'
                : 'bg-blue-500/20 text-blue-400'"
                class="text-xs px-2 py-0.5 rounded font-semibold">
                {{ (stock as any).tradeType || '현금' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 매수 이력 (그룹 내 여러 건이 있을 때) -->
      <div class="bg-gray-800 rounded-xl p-6 mb-6">
        <h2 class="text-lg font-semibold mb-3">
          매수 이력
          <span class="text-sm text-gray-400 font-normal ml-1">{{ groupStocks.length }}건</span>
        </h2>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-gray-400 text-xs border-b border-gray-700">
              <th class="text-left py-2 pr-4">매수일</th>
              <th class="text-right py-2 pr-4">단가</th>
              <th class="text-right py-2 pr-4">수량</th>
              <th class="text-right py-2 pr-4">투자금액</th>
              <th class="text-center py-2 pr-4">거래유형</th>
              <th class="text-left py-2 pr-4">플랫폼</th>
              <th class="text-left py-2">메모</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in groupStocks" :key="s.id"
              class="border-b border-gray-700/50 last:border-0">
              <td class="py-2 pr-4 text-gray-300 font-mono">{{ new Date(s.buyDate).toLocaleDateString('ko-KR') }}</td>
              <td class="py-2 pr-4 text-right font-mono">{{ formatPrice(s.buyPrice) }}</td>
              <td class="py-2 pr-4 text-right font-mono">{{ s.quantity }}주</td>
              <td class="py-2 pr-4 text-right font-mono">{{ formatPrice(s.buyPrice * s.quantity) }}</td>
              <td class="py-2 pr-4 text-center">
                <span :class="(s.tradeType || '현금') === '신용' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'"
                  class="text-[10px] px-1.5 py-0.5 rounded font-semibold">
                  {{ s.tradeType || '현금' }}
                </span>
              </td>
              <td class="py-2 pr-4 text-gray-400 text-sm">{{ s.platform || '-' }}</td>
              <td class="py-2 text-gray-400">
                <span v-if="s.memo" class="flex items-center gap-1">
                  <span class="text-green-500 font-bold text-xs">O</span> {{ s.memo }}
                </span>
                <span v-else class="text-gray-600 text-xs">✕</span>
              </td>
            </tr>
          </tbody>
          <!-- 합산 행 (2건 이상일 때) -->
          <tfoot v-if="groupStocks.length > 1">
            <tr class="text-gray-300 text-xs border-t border-gray-600 font-semibold">
              <td class="pt-2 pr-4 text-gray-400">합계</td>
              <td class="pt-2 pr-4 text-right font-mono">{{ formatPrice(avgBuyPrice) }} <span class="text-gray-500 font-normal">(평균)</span></td>
              <td class="pt-2 pr-4 text-right font-mono">{{ totalQuantity }}주</td>
              <td class="pt-2 pr-4 text-right font-mono">{{ formatPrice(avgBuyPrice * totalQuantity) }}</td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- 차트 -->
      <div class="bg-gray-800 rounded-xl p-6">
        <h2 class="text-lg font-semibold mb-4">주가 차트</h2>
        <div class="overflow-x-auto">
          <ClientOnly>
            <StockChart :ticker="stock.ticker" />
            <template #fallback>
              <div class="h-[350px] flex items-center justify-center text-gray-500">
                차트 로딩 중...
              </div>
            </template>
          </ClientOnly>
        </div>
      </div>
    </main>

    <div v-else class="p-12 text-center text-gray-400">종목을 찾을 수 없습니다</div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'

const { user } = useAuth()
watchEffect(() => { if (!user.value) navigateTo('/login') })

const route = useRoute()
const stockId = route.params.id

// 클릭한 종목 (ticker/tradeType 기준으로 그룹 특정)
const { data: stock } = await useFetch(`/api/stocks/${stockId}`, {
  headers: useRequestHeaders(['cookie']),
})

// 전체 stocks 조회 → 같은 ticker + tradeType 그룹 추출
const { data: allStocks } = await useFetch('/api/stocks', {
  headers: useRequestHeaders(['cookie']),
})

const groupStocks = computed(() => {
  if (!stock.value || !allStocks.value) return stock.value ? [stock.value] : []
  const s = stock.value as any
  return (allStocks.value as any[]).filter(
    (x: any) => x.ticker === s.ticker && (x.tradeType || '현금') === (s.tradeType || '현금')
  ).sort((a: any, b: any) => new Date(a.buyDate).getTime() - new Date(b.buyDate).getTime())
})

// 합산 수량
const totalQuantity = computed(() =>
  groupStocks.value.reduce((sum, s: any) => sum + s.quantity, 0)
)

// 가중평균 단가
const avgBuyPrice = computed(() => {
  const total = groupStocks.value.reduce((sum, s: any) => sum + s.buyPrice * s.quantity, 0)
  return totalQuantity.value ? total / totalQuantity.value : 0
})

// 현재가 조회
const quote = ref<any>(null)
onMounted(async () => {
  if (stock.value) {
    try {
      const quotes = await $fetch(`/api/quotes?tickers=${(stock.value as any).ticker}`)
      quote.value = (quotes as any)[(stock.value as any).ticker]
    } catch {}
  }
})

const currentPrice = computed(() => quote.value?.currentPrice ?? avgBuyPrice.value)
const currentValue = computed(() => currentPrice.value * totalQuantity.value)
const profit = computed(() => (currentPrice.value - avgBuyPrice.value) * totalQuantity.value)
const profitRate = computed(() =>
  avgBuyPrice.value ? ((currentPrice.value - avgBuyPrice.value) / avgBuyPrice.value) * 100 : 0
)

function formatPrice(price: any) {
  return Number(price).toLocaleString('ko-KR', { maximumFractionDigits: 2 })
}
</script>
