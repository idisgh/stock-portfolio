<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- 헤더 -->
    <header class="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <h1 class="text-xl font-bold flex items-center gap-2">
        <TrendingUp :size="22" class="text-blue-400" />
        Stock Portfolio
      </h1>
      <div class="flex items-center gap-4">
        <span class="text-gray-400 text-sm">{{ user?.name }}</span>
        <button @click="logout()" class="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition">
          <LogOut :size="14" />
          로그아웃
        </button>
      </div>
    </header>

    <main class="max-w-6xl mx-auto p-6">
      <!-- 포트폴리오 요약 -->
      <div v-if="stocks?.length" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-gray-800 rounded-xl p-4 text-right">
          <div class="text-gray-400 text-xs flex items-center justify-end gap-1">
            환율 <span class="text-gray-500">USD/KRW</span>
          </div>
          <div class="text-lg font-bold mt-1">₩{{ exchangeRate.toLocaleString() }}</div>
        </div>
        <div class="bg-gray-800 rounded-xl p-4 text-right">
          <div class="text-gray-400 text-xs">총 투자금액 (₩)</div>
          <div class="text-lg font-bold mt-1">{{ formatKRW(totalInvestedKRW) }}</div>
        </div>
        <div class="bg-gray-800 rounded-xl p-4 text-right">
          <div class="text-gray-400 text-xs">총 평가금액 (₩)</div>
          <div class="text-lg font-bold mt-1">{{ formatKRW(totalCurrentKRW) }}</div>
        </div>
        <div class="bg-gray-800 rounded-xl p-4 text-right">
          <div class="text-gray-400 text-xs">총 수익률</div>
          <div class="text-lg font-bold mt-1" :class="totalProfitRate >= 0 ? 'text-red-400' : 'text-blue-400'">
            {{ totalProfitRate >= 0 ? '+' : '' }}{{ totalProfitRate.toFixed(2) }}%
          </div>
        </div>
      </div>

      <!-- 종목 추가 폼 -->
      <div class="bg-gray-800 rounded-xl p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4">종목 추가</h2>

        <!-- 선택된 종목 표시 -->
        <div v-if="form.ticker" class="flex items-center gap-3 mb-3 px-3 py-2 bg-gray-700 rounded-lg">
          <span class="font-medium text-sm">{{ form.ticker }}</span>
          <span class="text-gray-400 text-sm">{{ form.name }}</span>
          <button @click="clearSelection" class="ml-auto flex items-center gap-1 text-gray-500 hover:text-red-400 text-xs">
            <X :size="12" /> 변경
          </button>
        </div>

        <!-- 종목 검색 (선택 전) -->
        <div v-else class="mb-3">
          <StockSearch @select="onStockSelect" />
        </div>

        <!-- 나머지 입력 필드 -->
        <form @submit.prevent="addStock" class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="relative">
            <input v-model="form.buyPrice" type="number" step="0.01" placeholder="매수단가"
              class="input-field w-full pr-7" />
            <button v-if="form.buyPrice" type="button" @click="form.buyPrice = ''"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition">
              <X :size="13" />
            </button>
          </div>
          <input v-model="form.quantity" type="number" placeholder="수량"
            class="input-field" />
          <input v-model="form.buyDate" type="date"
            class="input-field" />
          <input v-model="form.platform" list="platform-list" placeholder="플랫폼 선택 또는 입력" class="input-field" />
          <datalist id="platform-list">
            <option>키움증권</option>
            <option>토스증권</option>
            <option>미래에셋</option>
            <option>삼성증권</option>
            <option>KB증권</option>
            <option>신한투자</option>
            <option>NH투자증권</option>
            <option>Interactive Brokers</option>
          </datalist>
          <input v-model="form.memo" placeholder="메모 (선택)"
            class="input-field col-span-2" />
          <button type="submit" :disabled="adding || !form.ticker"
            class="col-span-2 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-sm transition disabled:opacity-50">
            {{ adding ? '추가 중...' : '+ 추가' }}
          </button>
        </form>
        <p v-if="addError" class="text-red-400 text-sm mt-2">{{ addError }}</p>
      </div>

      <!-- 종목 리스트 -->
      <div class="bg-gray-800 rounded-xl overflow-hidden max-h-[70vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h2 class="text-lg font-semibold">보유 종목</h2>
          <div class="flex items-center gap-3">
            <span class="text-gray-400 text-sm">{{ stocks?.length || 0 }}개</span>
            <button @click="refreshAll" :disabled="quotesLoading"
              class="flex items-center gap-1 text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
              <RefreshCw :size="13" :class="quotesLoading ? 'animate-spin' : ''" />
              {{ quotesLoading ? '조회 중...' : '시세 갱신' }}
            </button>
          </div>
        </div>

        <div v-if="pending" class="p-6 text-center text-gray-400">불러오는 중...</div>
        <div v-else-if="!stocks?.length" class="p-12 text-center text-gray-500">
          <p class="text-4xl mb-2">📊</p>
          <p>아직 등록된 종목이 없습니다</p>
        </div>

        <!-- 미장 (USD) -->
        <template v-if="usStocks.length">
          <div class="px-6 pt-4 pb-2 text-xs text-gray-500 font-semibold tracking-wider border-b border-gray-700/50">
            <span class="inline-flex items-center gap-1"><span class="text-xs px-1.5 py-0.5 bg-red-900/50 text-red-300 rounded">US</span> 미장</span>
          </div>
          <div class="overflow-x-auto">
          <table class="w-full table-fixed min-w-[720px]">
            <colgroup>
              <col style="width: 18%" /><!-- 종목 -->
              <col style="width: 8%" /> <!-- 주간 -->
              <col style="width: 8%" /> <!-- 플랫폼 -->
              <col style="width: 14%" /><!-- 매수단가 -->
              <col style="width: 14%" /><!-- 현재가 -->
              <col style="width: 7%" /> <!-- 수량 -->
              <col style="width: 11%" /><!-- 수익률 -->
              <col style="width: 14%" /><!-- 수익금 -->
              <col style="width: 4%" /> <!-- 삭제 -->
            </colgroup>
            <thead>
              <tr class="text-gray-400 text-xs border-b border-gray-700">
                <th class="text-left px-4 py-2">종목</th>
                <th class="text-center px-2 py-2">주간</th>
                <th class="text-center px-2 py-2">플랫폼</th>
                <th class="text-right px-3 py-2">
                  매수단가
                  <button @click="showInKRW = !showInKRW" class="ml-1 text-gray-500 hover:text-white transition" title="통화 전환">
                    {{ showInKRW ? '₩' : '$' }}
                  </button>
                </th>
                <th class="text-right px-3 py-2">현재가</th>
                <th class="text-right px-3 py-2">수량</th>
                <th class="text-right px-3 py-2">수익률</th>
                <th class="text-right px-3 py-2">수익금</th>
                <th class="text-center px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stock in usStocks" :key="stock.id"
                class="border-b border-gray-700/50 hover:bg-gray-700/30 transition group">
                <td class="px-4 py-3 cursor-pointer" @click="navigateTo(`/stock/${stock.id}`)">
                  <div class="font-medium hover:text-blue-400 transition text-sm">{{ stock.name }}</div>
                  <div class="text-gray-500 text-xs">{{ stock.ticker }}</div>
                </td>
                <td class="text-center px-2 py-3">
                  <Sparkline v-if="sparklines[stock.ticker]?.length" :data="sparklines[stock.ticker]" :width="40" :height="18" />
                  <span v-else class="text-gray-600 text-xs">-</span>
                </td>
                <td class="text-center px-2 py-3">
                  <template v-if="editing?.id === stock.id && editing?.field === 'platform'">
                    <input v-model="editing.value" placeholder="플랫폼"
                      class="w-16 px-1 py-0.5 bg-gray-600 rounded text-xs text-center"
                      @keyup.enter="saveEdit(stock)" @keyup.escape="cancelEdit" @blur="saveOrCancel(stock)" />
                  </template>
                  <span v-else class="text-gray-500 text-xs cursor-pointer hover:text-yellow-400"
                    @click.stop="startEdit(stock, 'platform', stock.platform || '')">
                    {{ stock.platform || '-' }}
                  </span>
                </td>
                <td class="text-right px-3 py-3">
                  <template v-if="editing?.id === stock.id && editing?.field === 'buyPrice'">
                    <input v-model="editing.value" type="number" step="0.01"
                      class="w-24 px-2 py-1 bg-gray-600 rounded text-right text-sm font-mono"
                      @keyup.enter="saveEdit(stock)" @keyup.escape="cancelEdit" @blur="saveOrCancel(stock)" />
                  </template>
                  <span v-else class="font-mono text-sm cursor-pointer hover:text-yellow-400 transition"
                    @click="startEdit(stock, 'buyPrice', stock.buyPrice)">
                    {{ showInKRW ? '₩' + formatPrice(stock.buyPrice * exchangeRate) : '$' + formatPrice(stock.buyPrice) }}
                  </span>
                </td>
                <td class="text-right px-3 py-3 font-mono text-sm">
                  <template v-if="quotes[stock.ticker]">
                    ${{ formatPrice(quotes[stock.ticker].currentPrice) }}
                    <div class="text-xs" :class="quotes[stock.ticker].changePercent >= 0 ? 'text-red-400' : 'text-blue-400'">
                      {{ quotes[stock.ticker].changePercent >= 0 ? '▲' : '▼' }}
                      {{ Math.abs(quotes[stock.ticker].changePercent).toFixed(2) }}%
                    </div>
                  </template>
                  <span v-else class="text-gray-500">-</span>
                </td>
                <td class="text-right px-3 py-3">
                  <template v-if="editing?.id === stock.id && editing?.field === 'quantity'">
                    <input v-model="editing.value" type="number"
                      class="w-16 px-2 py-1 bg-gray-600 rounded text-right text-sm font-mono"
                      @keyup.enter="saveEdit(stock)" @keyup.escape="cancelEdit" @blur="saveOrCancel(stock)" />
                  </template>
                  <span v-else class="font-mono text-sm cursor-pointer hover:text-yellow-400 transition"
                    @click="startEdit(stock, 'quantity', stock.quantity)">{{ stock.quantity }}</span>
                </td>
                <td class="text-right px-3 py-3 font-mono text-sm font-semibold"
                  :class="getProfitRate(stock) >= 0 ? 'text-red-400' : 'text-blue-400'">
                  {{ getProfitRate(stock) >= 0 ? '+' : '' }}{{ getProfitRate(stock).toFixed(2) }}%
                </td>
                <td class="text-right px-3 py-3 font-mono text-sm"
                  :class="getProfit(stock) >= 0 ? 'text-red-400' : 'text-blue-400'">
                  {{ formatCurrency(getProfit(stock), '$') }}
                </td>
                <td class="text-center px-2 py-3">
                  <button @click="deleteStock(stock.id)"
                    class="text-gray-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100"><X :size="14" /></button>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </template>

        <!-- 국장 (KRW) -->
        <template v-if="krStocks.length">
          <div class="px-6 pt-4 pb-2 text-xs text-gray-500 font-semibold tracking-wider border-b border-gray-700/50">
            <span class="inline-flex items-center gap-1"><span class="text-xs px-1.5 py-0.5 bg-blue-900/50 text-blue-300 rounded">KR</span> 국장</span>
          </div>
          <div class="overflow-x-auto">
          <table class="w-full table-fixed min-w-[720px]">
            <colgroup>
              <col style="width: 18%" />
              <col style="width: 8%" />
              <col style="width: 8%" />
              <col style="width: 14%" />
              <col style="width: 14%" />
              <col style="width: 7%" />
              <col style="width: 11%" />
              <col style="width: 14%" />
              <col style="width: 4%" />
            </colgroup>
            <thead>
              <tr class="text-gray-400 text-xs border-b border-gray-700">
                <th class="text-left px-4 py-2">종목</th>
                <th class="text-center px-2 py-2">주간</th>
                <th class="text-center px-2 py-2">플랫폼</th>
                <th class="text-right px-3 py-2">매수단가</th>
                <th class="text-right px-3 py-2">현재가</th>
                <th class="text-right px-3 py-2">수량</th>
                <th class="text-right px-3 py-2">수익률</th>
                <th class="text-right px-3 py-2">수익금</th>
                <th class="text-center px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stock in krStocks" :key="stock.id"
                class="border-b border-gray-700/50 hover:bg-gray-700/30 transition group">
                <td class="px-4 py-3 cursor-pointer" @click="navigateTo(`/stock/${stock.id}`)">
                  <div class="font-medium hover:text-blue-400 transition text-sm">{{ stock.name }}</div>
                  <div class="text-gray-500 text-xs">{{ stock.ticker }}</div>
                </td>
                <td class="text-center px-2 py-3">
                  <Sparkline v-if="sparklines[stock.ticker]?.length" :data="sparklines[stock.ticker]" :width="40" :height="18" />
                  <span v-else class="text-gray-600 text-xs">-</span>
                </td>
                <td class="text-center px-2 py-3">
                  <template v-if="editing?.id === stock.id && editing?.field === 'platform'">
                    <input v-model="editing.value" placeholder="플랫폼"
                      class="w-16 px-1 py-0.5 bg-gray-600 rounded text-xs text-center"
                      @keyup.enter="saveEdit(stock)" @keyup.escape="cancelEdit" @blur="saveOrCancel(stock)" />
                  </template>
                  <span v-else class="text-gray-500 text-xs cursor-pointer hover:text-yellow-400"
                    @click.stop="startEdit(stock, 'platform', stock.platform || '')">
                    {{ stock.platform || '-' }}
                  </span>
                </td>
                <td class="text-right px-3 py-3">
                  <template v-if="editing?.id === stock.id && editing?.field === 'buyPrice'">
                    <input v-model="editing.value" type="number" step="1"
                      class="w-24 px-2 py-1 bg-gray-600 rounded text-right text-sm font-mono"
                      @keyup.enter="saveEdit(stock)" @keyup.escape="cancelEdit" @blur="saveOrCancel(stock)" />
                  </template>
                  <span v-else class="font-mono text-sm cursor-pointer hover:text-yellow-400 transition"
                    @click="startEdit(stock, 'buyPrice', stock.buyPrice)">
                    ₩{{ formatPrice(stock.buyPrice) }}
                  </span>
                </td>
                <td class="text-right px-3 py-3 font-mono text-sm">
                  <template v-if="quotes[stock.ticker]">
                    ₩{{ formatPrice(quotes[stock.ticker].currentPrice) }}
                    <div class="text-xs" :class="quotes[stock.ticker].changePercent >= 0 ? 'text-red-400' : 'text-blue-400'">
                      {{ quotes[stock.ticker].changePercent >= 0 ? '▲' : '▼' }}
                      {{ Math.abs(quotes[stock.ticker].changePercent).toFixed(2) }}%
                    </div>
                  </template>
                  <span v-else class="text-gray-500">-</span>
                </td>
                <td class="text-right px-3 py-3">
                  <template v-if="editing?.id === stock.id && editing?.field === 'quantity'">
                    <input v-model="editing.value" type="number"
                      class="w-16 px-2 py-1 bg-gray-600 rounded text-right text-sm font-mono"
                      @keyup.enter="saveEdit(stock)" @keyup.escape="cancelEdit" @blur="saveOrCancel(stock)" />
                  </template>
                  <span v-else class="font-mono text-sm cursor-pointer hover:text-yellow-400 transition"
                    @click="startEdit(stock, 'quantity', stock.quantity)">{{ stock.quantity }}</span>
                </td>
                <td class="text-right px-3 py-3 font-mono text-sm font-semibold"
                  :class="getProfitRate(stock) >= 0 ? 'text-red-400' : 'text-blue-400'">
                  {{ getProfitRate(stock) >= 0 ? '+' : '' }}{{ getProfitRate(stock).toFixed(2) }}%
                </td>
                <td class="text-right px-3 py-3 font-mono text-sm"
                  :class="getProfit(stock) >= 0 ? 'text-red-400' : 'text-blue-400'">
                  {{ formatCurrency(getProfit(stock), '₩') }}
                </td>
                <td class="text-center px-2 py-3">
                  <button @click="deleteStock(stock.id)"
                    class="text-gray-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100"><X :size="14" /></button>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { TrendingUp, RefreshCw, X, LogOut } from 'lucide-vue-next'

const { user, logout } = useAuth()
watchEffect(() => { if (!user.value) navigateTo('/login') })

const { data: stocks, pending, refresh } = await useFetch('/api/stocks', {
  headers: useRequestHeaders(['cookie']),
})

// 국장/미장 분리
const usStocks = computed(() => (stocks.value || []).filter((s: any) => isUSD(s)))
const krStocks = computed(() => (stocks.value || []).filter((s: any) => !isUSD(s)))

// 시세, 환율, 스파크라인
const quotes = ref<Record<string, any>>({})
const sparklines = ref<Record<string, number[]>>({})
const exchangeRate = ref(1450)
const quotesLoading = ref(false)
const showInKRW = ref(false)

watch(stocks, () => {
  if (stocks.value?.length) refreshAll()
}, { immediate: true })

async function refreshAll() {
  if (!stocks.value?.length) return
  quotesLoading.value = true
  const tickers = stocks.value.map((s: any) => s.ticker).join(',')

  try {
    const [q, sp, ex] = await Promise.all([
      $fetch(`/api/quotes?tickers=${tickers}`),
      $fetch(`/api/sparkline?tickers=${tickers}`),
      $fetch('/api/exchange-rate'),
    ])
    quotes.value = q as any
    sparklines.value = sp as any
    exchangeRate.value = (ex as any).rate
  } catch {} finally {
    quotesLoading.value = false
  }
}

// 통화 변환 (USD → KRW)
function isUSD(stock: any) {
  const q = quotes.value[stock.ticker]
  return q?.currency === 'USD' || (!q && !stock.ticker.includes('.KS'))
}

function toKRW(stock: any) {
  return isUSD(stock) ? stock.buyPrice * exchangeRate.value : stock.buyPrice
}

function currentPriceKRW(stock: any) {
  const cp = getCurrentPrice(stock)
  return isUSD(stock) ? cp * exchangeRate.value : cp
}

// 수익률 계산
function getCurrentPrice(stock: any) {
  return quotes.value[stock.ticker]?.currentPrice ?? stock.buyPrice
}
function getProfit(stock: any) {
  return (getCurrentPrice(stock) - stock.buyPrice) * stock.quantity
}
function getProfitRate(stock: any) {
  if (!stock.buyPrice) return 0
  return ((getCurrentPrice(stock) - stock.buyPrice) / stock.buyPrice) * 100
}

// 총액 (원화 환산)
const totalInvestedKRW = computed(() =>
  (stocks.value || []).reduce((sum: number, s: any) => sum + toKRW(s) * s.quantity, 0)
)
const totalCurrentKRW = computed(() =>
  (stocks.value || []).reduce((sum: number, s: any) => sum + currentPriceKRW(s) * s.quantity, 0)
)
const totalProfitRate = computed(() =>
  totalInvestedKRW.value ? ((totalCurrentKRW.value - totalInvestedKRW.value) / totalInvestedKRW.value) * 100 : 0
)

// 인라인 수정
const editing = ref<{ id: number, field: string, value: any } | null>(null)

function startEdit(stock: any, field: string, value: any) {
  editing.value = { id: stock.id, field, value }
  // 다음 tick에서 input에 포커스
  nextTick(() => {
    const input = document.querySelector('input[type="number"]:focus, input[placeholder="플랫폼"]:focus') as HTMLInputElement
    input?.select()
  })
}

function cancelEdit() {
  editing.value = null
}

async function saveOrCancel(stock: any) {
  // blur 시: 값이 변경됐으면 저장, 아니면 취소
  if (!editing.value) return
  await saveEdit(stock)
}

async function saveEdit(stock: any) {
  if (!editing.value) return
  const { field, value } = editing.value
  editing.value = null  // 먼저 닫기

  try {
    await $fetch(`/api/stocks/${stock.id}`, {
      method: 'PUT',
      body: { [field]: field === 'buyPrice' ? Number(value) : field === 'quantity' ? Number(value) : value }
    })
    await refresh()
  } catch {}
}

// 종목 추가
const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
const form = reactive({ ticker: '', name: '', buyPrice: '', quantity: '', buyDate: today, platform: '', memo: '' })

async function onStockSelect(item: any) {
  form.ticker = item.ticker
  form.name = item.name
  form.buyPrice = ''
  try {
    const q = await $fetch(`/api/quotes?tickers=${item.ticker}`) as any
    const price = q[item.ticker]?.currentPrice
    if (price) form.buyPrice = String(price)
  } catch {}
}

function clearSelection() {
  form.ticker = ''
  form.name = ''
  form.buyPrice = ''
}
const adding = ref(false)
const addError = ref('')

async function addStock() {
  addError.value = ''
  adding.value = true
  try {
    await $fetch('/api/stocks', {
      method: 'POST',
      body: { ...form, buyPrice: Number(form.buyPrice), quantity: Number(form.quantity) }
    })
    Object.assign(form, { ticker: '', name: '', buyPrice: '', quantity: '', buyDate: '', platform: '', memo: '' })
    await refresh()
  } catch (e) {
    addError.value = (e as any).data?.statusMessage || '추가 실패'
  } finally {
    adding.value = false
  }
}

async function deleteStock(id: any) {
  if (!confirm('정말 삭제하시겠습니까?')) return
  await $fetch(`/api/stocks/${id}`, { method: 'DELETE' })
  await refresh()
}

function formatPrice(price: any) {
  return Number(price).toLocaleString('ko-KR', { maximumFractionDigits: 2 })
}
// 통화 포맷: -$63 또는 +$269.6 형태
function formatCurrency(value: any, symbol: string) {
  const n = Number(value)
  const sign = n >= 0 ? '+' : '-'
  return `${sign}${symbol}${formatPrice(Math.abs(n))}`
}

function formatKRW(price: any) {
  const n = Number(price)
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '억'
  if (n >= 10000) return Math.round(n / 10000).toLocaleString() + '만'
  return n.toLocaleString('ko-KR')
}
</script>

<style scoped>
.input-field {
  @apply px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-sm;
}
</style>
