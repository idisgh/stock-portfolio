<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <header class="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
      <button @click="navigateTo('/')" class="flex items-center gap-1 text-gray-400 hover:text-white transition">
        <ArrowLeft :size="16" /> 뒤로
      </button>
      <h1 class="text-xl font-bold" v-if="stock">{{ stock.name }} ({{ stock.ticker }})</h1>
    </header>

    <main class="max-w-4xl mx-auto p-6" v-if="stock">
      <!-- 종목 정보 카드 -->
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
          <div class="text-gray-400 text-sm">매수단가</div>
          <div class="text-xl font-bold mt-1">{{ formatPrice(stock.buyPrice) }}</div>
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

      <!-- 보유 정보 -->
      <div class="bg-gray-800 rounded-xl p-6 mb-6">
        <h2 class="text-lg font-semibold mb-3">보유 정보</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="text-gray-400">수량</span>
            <div class="font-mono mt-1">{{ stock.quantity }}주</div>
          </div>
          <div>
            <span class="text-gray-400">투자금액</span>
            <div class="font-mono mt-1">{{ formatPrice(stock.buyPrice * stock.quantity) }}</div>
          </div>
          <div>
            <span class="text-gray-400">평가금액</span>
            <div class="font-mono mt-1">{{ formatPrice(currentValue) }}</div>
          </div>
          <div>
            <span class="text-gray-400">매수일</span>
            <div class="font-mono mt-1">{{ new Date(stock.buyDate).toLocaleDateString('ko-KR') }}</div>
          </div>
        </div>
        <div v-if="stock.memo" class="mt-3 text-gray-400 text-sm flex items-center gap-1">
          <StickyNote :size="14" /> {{ stock.memo }}
        </div>
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
import { ArrowLeft, StickyNote } from 'lucide-vue-next'

const { user } = useAuth()
watchEffect(() => { if (!user.value) navigateTo('/login') })

// URL에서 id 추출 (/stock/1 → id = 1)
const route = useRoute()
const stockId = route.params.id

// 종목 데이터 조회 (useRequestHeaders로 SSR 시 쿠키 전달)
const { data: stock } = await useFetch(`/api/stocks/${stockId}`, {
  headers: useRequestHeaders(['cookie']),
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

// 수익률 계산
const currentPrice = computed(() => quote.value?.currentPrice ?? (stock.value as any)?.buyPrice ?? 0)
const currentValue = computed(() => currentPrice.value * ((stock.value as any)?.quantity ?? 0))
const profit = computed(() => (currentPrice.value - ((stock.value as any)?.buyPrice ?? 0)) * ((stock.value as any)?.quantity ?? 0))
const profitRate = computed(() => {
  const bp = (stock.value as any)?.buyPrice
  return bp ? ((currentPrice.value - bp) / bp) * 100 : 0
})

function formatPrice(price: any) {
  return Number(price).toLocaleString('ko-KR', { maximumFractionDigits: 2 })
}
</script>
