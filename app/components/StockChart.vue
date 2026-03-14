<template>
  <div>
    <!-- 기간 선택 버튼 -->
    <div class="flex gap-2 mb-3 flex-wrap">
      <button
        v-for="p in periods"
        :key="p.range"
        @click="selectPeriod(p)"
        :class="selected.range === p.range
          ? 'bg-blue-600 text-white'
          : 'bg-gray-700 text-gray-400'"
        class="px-3 py-1 rounded-lg text-xs font-medium transition hover:bg-gray-600"
      >
        {{ p.label }}
      </button>
    </div>

    <!-- 차트 영역 -->
    <div ref="chartContainer" class="rounded-lg overflow-hidden" style="height: 350px; min-width: 600px; width: 100%;"></div>

    <div v-if="loading" class="text-center text-gray-400 text-sm mt-2">차트 로딩 중...</div>
    <div v-if="error" class="text-center text-red-400 text-sm mt-2">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts'

const props = defineProps<{ ticker: string }>()

const chartContainer = ref<HTMLElement>()
const loading = ref(false)
const error = ref('')

let chart: any = null
let candleSeries: any = null
let volumeSeries: any = null

const periods = [
  { label: '1일',   range: '1d',  interval: '5m'  },
  { label: '5일',   range: '5d',  interval: '1h'  },
  { label: '1개월', range: '1mo', interval: '1d'  },
  { label: '3개월', range: '3mo', interval: '1d'  },
  { label: '6개월', range: '6mo', interval: '1d'  },
  { label: '1년',   range: '1y',  interval: '1d'  },
  { label: '2년',   range: '2y',  interval: '1wk' },
]

const selected = ref({ ...periods[2] }) // 기본: 1개월

function selectPeriod(p: typeof periods[number]) {
  selected.value = { ...p } // 항상 새 객체로 → watch 확실히 발동
}

// 차트 초기화 (최초 1회)
function initChart() {
  if (!chartContainer.value || chart) return

  chart = createChart(chartContainer.value, {
    layout: {
      background: { color: '#1f2937' },
      textColor: '#9ca3af',
    },
    grid: {
      vertLines: { color: '#374151' },
      horzLines: { color: '#374151' },
    },
    crosshair: { mode: 0 },
    rightPriceScale: { borderColor: '#4b5563' },
    timeScale: {
      borderColor: '#4b5563',
      timeVisible: true,   // 항상 표시 (분봉: 시간, 일봉: 날짜)
      secondsVisible: false,
    },
  })

  addSeries()
}

// series 추가 (최초 또는 교체 시)
function addSeries() {
  candleSeries = chart.addSeries(CandlestickSeries, {
    upColor:         '#ef4444',
    downColor:       '#3b82f6',
    borderUpColor:   '#ef4444',
    borderDownColor: '#3b82f6',
    wickUpColor:     '#ef4444',
    wickDownColor:   '#3b82f6',
  })

  volumeSeries = chart.addSeries(HistogramSeries, {
    priceFormat: { type: 'volume' },
    priceScaleId: 'volume',
  })

  chart.priceScale('volume').applyOptions({
    scaleMargins: { top: 0.8, bottom: 0 },
  })
}

// series 제거 후 재추가 (기간 전환 시 time 타입 초기화)
function resetSeries() {
  if (candleSeries) { chart.removeSeries(candleSeries); candleSeries = null }
  if (volumeSeries) { chart.removeSeries(volumeSeries); volumeSeries = null }
  addSeries()
}

// 데이터 로드
async function loadData() {
  if (!chart) return
  loading.value = true
  error.value = ''

  const { range, interval } = selected.value

  try {
    const data: any = await $fetch(
      `/api/history?ticker=${props.ticker}&range=${range}&interval=${interval}`
    )
    const candles = data.candles || []
    const intraday: boolean = data.intraday ?? false

    if (!candles.length) {
      error.value = '데이터가 없습니다'
      return
    }

    // 분봉이면 시간 표시, 일봉이면 날짜만 (secondsVisible로 조절)
    chart.timeScale().applyOptions({ timeVisible: intraday })

    candleSeries.setData(candles.map((c: any) => ({
      time: c.time, open: c.open, high: c.high, low: c.low, close: c.close,
    })))

    volumeSeries.setData(candles.map((c: any) => ({
      time: c.time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)',
    })))

    chart.timeScale().fitContent()
  } catch (e) {
    console.error('차트 오류:', e)
    error.value = '차트 데이터 로드 실패'
  } finally {
    loading.value = false
  }
}

// 기간 변경 시 series 교체 + 데이터 재로드
watch(selected, async () => {
  resetSeries()
  await loadData()
})

onMounted(() => {
  initChart()
  loadData()
})

onUnmounted(() => {
  chart?.remove()
  chart = null
})
</script>
