<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <header class="border-b border-gray-800 px-6 py-4 flex items-center gap-4">
      <button @click="navigateTo('/')" class="flex items-center gap-1 text-gray-400 hover:text-white transition">
        <ArrowLeft :size="16" /> 뒤로
      </button>
      <h1 class="text-xl font-bold" v-if="stock">{{ stock.name }} ({{ stock.ticker }})</h1>
    </header>

    <main class="max-w-4xl mx-auto p-6" v-if="stock">
      <!-- 종목 요약 카드 (합산 기준) -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-gray-800 rounded-xl p-4">
          <div class="text-gray-400 text-sm">현재가</div>
          <div class="text-xl font-bold mt-1">{{ quote ? formatPrice(quote.currentPrice) : '-' }}</div>
          <div v-if="quote" class="text-sm mt-1"
            :class="quote.changePercent >= 0 ? 'text-red-400' : 'text-blue-400'">
            {{ quote.changePercent >= 0 ? '▲' : '▼' }} {{ Math.abs(quote.changePercent).toFixed(2) }}%
          </div>
        </div>
        <div class="bg-gray-800 rounded-xl p-4">
          <div class="text-gray-400 text-sm">평균단가 <span v-if="groupStocks.length > 1" class="text-xs text-gray-500">({{ groupStocks.length }}건 평균)</span></div>
          <div class="text-xl font-bold mt-1">{{ formatPrice(avgBuyPrice) }}</div>
        </div>
        <div class="bg-gray-800 rounded-xl p-4">
          <div class="text-gray-400 text-sm">수익률</div>
          <div class="text-xl font-bold mt-1" :class="profitRate >= 0 ? 'text-red-400' : 'text-blue-400'">
            {{ profitRate >= 0 ? '+' : '' }}{{ profitRate.toFixed(2) }}%
          </div>
        </div>
        <div class="bg-gray-800 rounded-xl p-4">
          <div class="text-gray-400 text-sm">평가손익</div>
          <div class="text-xl font-bold mt-1" :class="profit >= 0 ? 'text-red-400' : 'text-blue-400'">
            {{ profit >= 0 ? '+' : '' }}{{ formatPrice(profit) }}
          </div>
        </div>
      </div>

      <!-- 보유 정보 -->
      <div class="bg-gray-800 rounded-xl p-6 mb-6">
        <h2 class="text-lg font-semibold mb-3">보유 정보</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
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
        </div>
      </div>

      <!-- 매수 이력 (인라인 수정 가능) -->
      <div class="bg-gray-800 rounded-xl p-6 mb-6">
        <h2 class="text-lg font-semibold mb-3">
          매수 이력
          <span class="text-sm text-gray-400 font-normal ml-1">{{ groupStocks.length }}건</span>
          <span class="text-xs text-gray-500 font-normal ml-2">셀 클릭 시 수정 가능</span>
        </h2>
        <div class="overflow-x-auto">
        <table class="w-full text-sm min-w-[640px]">
          <thead>
            <tr class="text-gray-400 text-xs border-b border-gray-700">
              <th class="text-left py-2 pr-3">매수일</th>
              <th class="text-right py-2 pr-3">단가</th>
              <th class="text-right py-2 pr-3">수량</th>
              <th class="text-right py-2 pr-3">투자금액</th>
              <th class="text-center py-2 pr-3">거래유형</th>
              <th class="text-left py-2 pr-3">플랫폼</th>
              <th class="text-left py-2">메모</th>
              <th class="text-center py-2 w-8"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in groupStocks" :key="s.id" class="border-b border-gray-700/50 last:border-0 group">
              <!-- 매수일 -->
              <td class="py-2 pr-3 text-gray-300 font-mono text-xs">
                {{ new Date(s.buyDate).toLocaleDateString('ko-KR') }}
              </td>
              <!-- 단가 -->
              <td class="py-2 pr-3 text-right">
                <template v-if="editing?.id === s.id && editing?.field === 'buyPrice'">
                  <input v-model="editing.value" type="number" step="0.01"
                    class="w-24 px-2 py-0.5 bg-gray-600 border border-blue-500 rounded text-right text-sm font-mono"
                    @keyup.enter="saveEdit(s)" @keyup.escape="cancelEdit" @blur="saveEdit(s)" />
                </template>
                <span v-else class="font-mono cursor-pointer hover:text-yellow-400 transition"
                  @click="startEdit(s, 'buyPrice', s.buyPrice)">
                  {{ formatPrice(s.buyPrice) }}
                </span>
              </td>
              <!-- 수량 -->
              <td class="py-2 pr-3 text-right">
                <template v-if="editing?.id === s.id && editing?.field === 'quantity'">
                  <input v-model="editing.value" type="number"
                    class="w-16 px-2 py-0.5 bg-gray-600 border border-blue-500 rounded text-right text-sm font-mono"
                    @keyup.enter="saveEdit(s)" @keyup.escape="cancelEdit" @blur="saveEdit(s)" />
                </template>
                <span v-else class="font-mono cursor-pointer hover:text-yellow-400 transition"
                  @click="startEdit(s, 'quantity', s.quantity)">
                  {{ s.quantity }}주
                </span>
              </td>
              <!-- 투자금액 (읽기 전용) -->
              <td class="py-2 pr-3 text-right font-mono text-gray-400">
                {{ formatPrice(s.buyPrice * s.quantity) }}
              </td>
              <!-- 거래유형 -->
              <td class="py-2 pr-3 text-center">
                <template v-if="editing?.id === s.id && editing?.field === 'tradeType'">
                  <div class="flex gap-1 justify-center">
                    <button v-for="t in ['현금', '신용']" :key="t"
                      @click="editing.value = t; saveEdit(s)"
                      :class="editing.value === t
                        ? t === '신용' ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'
                        : 'bg-gray-600 text-gray-400'"
                      class="px-2 py-0.5 rounded text-xs font-medium">{{ t }}</button>
                  </div>
                </template>
                <span v-else
                  :class="(s.tradeType||'현금') === '신용' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'"
                  class="text-[10px] px-1.5 py-0.5 rounded font-semibold cursor-pointer hover:opacity-70"
                  @click="startEdit(s, 'tradeType', s.tradeType||'현금')">
                  {{ s.tradeType || '현금' }}
                </span>
              </td>
              <!-- 플랫폼 -->
              <td class="py-2 pr-3">
                <template v-if="editing?.id === s.id && editing?.field === 'platform'">
                  <input v-model="editing.value" list="platform-list-detail" placeholder="플랫폼"
                    class="w-28 px-2 py-0.5 bg-gray-600 border border-blue-500 rounded text-sm"
                    @keyup.enter="saveEdit(s)" @keyup.escape="cancelEdit" @blur="saveEdit(s)" />
                  <datalist id="platform-list-detail">
                    <option>키움증권</option><option>토스증권</option><option>미래에셋</option>
                    <option>삼성증권</option><option>KB증권</option><option>신한투자</option>
                    <option>NH투자증권</option><option>Interactive Brokers</option>
                  </datalist>
                </template>
                <span v-else class="text-gray-400 cursor-pointer hover:text-yellow-400 transition"
                  @click="startEdit(s, 'platform', s.platform||'')">
                  {{ s.platform || '-' }}
                </span>
              </td>
              <!-- 메모 -->
              <td class="py-2">
                <template v-if="editing?.id === s.id && editing?.field === 'memo'">
                  <input v-model="editing.value" placeholder="메모"
                    class="w-36 px-2 py-0.5 bg-gray-600 border border-blue-500 rounded text-sm"
                    @keyup.enter="saveEdit(s)" @keyup.escape="cancelEdit" @blur="saveEdit(s)" />
                </template>
                <span v-else class="cursor-pointer hover:text-yellow-400 transition"
                  @click="startEdit(s, 'memo', s.memo||'')">
                  <span v-if="s.memo" class="text-gray-400">{{ s.memo }}</span>
                  <span v-else class="text-gray-600">-</span>
                </span>
              </td>
              <!-- 개별 삭제 -->
              <td class="py-2 text-center">
                <button @click="deleteOne(s.id)"
                  class="text-gray-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100">
                  <X :size="13" />
                </button>
              </td>
            </tr>
          </tbody>
          <!-- 합산 행 -->
          <tfoot v-if="groupStocks.length > 1">
            <tr class="text-gray-300 text-xs border-t border-gray-600 font-semibold">
              <td class="pt-2 pr-3 text-gray-400">합계</td>
              <td class="pt-2 pr-3 text-right font-mono">{{ formatPrice(avgBuyPrice) }} <span class="text-gray-500 font-normal">(평균)</span></td>
              <td class="pt-2 pr-3 text-right font-mono">{{ totalQuantity }}주</td>
              <td class="pt-2 pr-3 text-right font-mono">{{ formatPrice(avgBuyPrice * totalQuantity) }}</td>
              <td colspan="4"></td>
            </tr>
          </tfoot>
        </table>
        </div>
        <p v-if="saveError" class="text-red-400 text-xs mt-2">{{ saveError }}</p>
      </div>

      <!-- 차트 -->
      <div class="bg-gray-800 rounded-xl p-6">
        <h2 class="text-lg font-semibold mb-4">주가 차트</h2>
        <div class="overflow-x-auto">
          <ClientOnly>
            <StockChart :ticker="(stock as any).ticker" />
            <template #fallback>
              <div class="h-[350px] flex items-center justify-center text-gray-500">차트 로딩 중...</div>
            </template>
          </ClientOnly>
        </div>
      </div>
    </main>

    <div v-else class="p-12 text-center text-gray-400">종목을 찾을 수 없습니다</div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, X } from 'lucide-vue-next'

const { user } = useAuth()
watchEffect(() => { if (!user.value) navigateTo('/login') })

const route = useRoute()
const stockId = route.params.id

const { data: stock } = await useFetch(`/api/stocks/${stockId}`, {
  headers: useRequestHeaders(['cookie']),
})

const { data: allStocks, refresh } = await useFetch('/api/stocks', {
  headers: useRequestHeaders(['cookie']),
})

// 같은 ticker 그룹 (매수일 오름차순)
const groupStocks = computed(() => {
  if (!stock.value || !allStocks.value) return stock.value ? [stock.value] : []
  const s = stock.value as any
  return (allStocks.value as any[])
    .filter((x: any) => x.ticker === s.ticker)
    .sort((a: any, b: any) => new Date(a.buyDate).getTime() - new Date(b.buyDate).getTime())
})

const totalQuantity = computed(() =>
  groupStocks.value.reduce((sum, s: any) => sum + s.quantity, 0)
)
const avgBuyPrice = computed(() => {
  const total = groupStocks.value.reduce((sum, s: any) => sum + s.buyPrice * s.quantity, 0)
  return totalQuantity.value ? total / totalQuantity.value : 0
})

// 현재가
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

// 인라인 수정
const editing = ref<{ id: number; field: string; value: any } | null>(null)
const saveError = ref('')

function startEdit(s: any, field: string, value: any) {
  editing.value = { id: s.id, field, value }
  nextTick(() => {
    const input = document.querySelector('.border-blue-500') as HTMLInputElement
    input?.focus()
    input?.select()
  })
}

function cancelEdit() {
  editing.value = null
}

async function saveEdit(s: any) {
  if (!editing.value || editing.value.id !== s.id) return
  const { field, value } = editing.value
  editing.value = null
  saveError.value = ''

  try {
    await $fetch(`/api/stocks/${s.id}`, {
      method: 'PUT',
      body: {
        [field]: field === 'buyPrice' || field === 'quantity' ? Number(value) : value
      }
    })
    await refresh()
  } catch {
    saveError.value = '수정 실패'
  }
}

async function deleteOne(id: number) {
  if (!confirm('이 매수 건을 삭제하시겠습니까?')) return
  await $fetch(`/api/stocks/${id}`, { method: 'DELETE' })
  // 그룹 내 마지막 건이면 목록으로
  if (groupStocks.value.length <= 1) {
    navigateTo('/')
  } else {
    await refresh()
  }
}

function formatPrice(price: any) {
  return Number(price).toLocaleString('ko-KR', { maximumFractionDigits: 2 })
}
</script>
