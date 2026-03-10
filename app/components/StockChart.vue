<template>
  <div>
    <!-- 기간 선택 버튼 -->
    <div class="flex gap-2 mb-3">
      <button
        v-for="p in periods"
        :key="p.value"
        @click="selectedPeriod = p.value"
        :class="selectedPeriod === p.value ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'"
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

const props = defineProps<{
  ticker: string
}>()

const chartContainer = ref<HTMLElement>()
const selectedPeriod = ref('3mo')
const loading = ref(false)
const error = ref('')

let chart: any = null
let candleSeries: any = null
let volumeSeries: any = null

const periods = [
  { label: '1개월', value: '1mo' },
  { label: '3개월', value: '3mo' },
  { label: '6개월', value: '6mo' },
  { label: '1년', value: '1y' },
  { label: '2년', value: '2y' },
]

// 차트 초기화
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
    crosshair: {
      mode: 0,
    },
    rightPriceScale: {
      borderColor: '#4b5563',
    },
    timeScale: {
      borderColor: '#4b5563',
      timeVisible: false,
    },
  })

  // lightweight-charts v5: addSeries(SeriesType, options)
  candleSeries = chart.addSeries(CandlestickSeries, {
    upColor: '#ef4444',       // 양봉 = 빨강 (한국식)
    downColor: '#3b82f6',     // 음봉 = 파랑
    borderUpColor: '#ef4444',
    borderDownColor: '#3b82f6',
    wickUpColor: '#ef4444',
    wickDownColor: '#3b82f6',
  })

  // 거래량 차트 (하단)
  volumeSeries = chart.addSeries(HistogramSeries, {
    priceFormat: { type: 'volume' },
    priceScaleId: 'volume',
  })

  chart.priceScale('volume').applyOptions({
    scaleMargins: { top: 0.8, bottom: 0 },
  })

  chart.timeScale().fitContent()
}

// 데이터 로드
async function loadData() {
  loading.value = true
  error.value = ''

  try {
    const data = await $fetch(`/api/history?ticker=${props.ticker}&period=${selectedPeriod.value}`)
    const candles = (data as any).candles || []

    if (!candles.length) {
      error.value = '데이터가 없습니다'
      return
    }

    candleSeries?.setData(candles.map((c: any) => ({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    })))

    volumeSeries?.setData(candles.map((c: any) => ({
      time: c.time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)',
    })))

    chart?.timeScale().fitContent()
  } catch {
    error.value = '차트 데이터 로드 실패'
  } finally {
    loading.value = false
  }
}

// 기간 변경 시 데이터 다시 로드
watch(selectedPeriod, () => loadData())

// 마운트 시 차트 생성 + 데이터 로드
onMounted(() => {
  initChart()
  loadData()
})

// 언마운트 시 차트 정리 (메모리 누수 방지)
onUnmounted(() => {
  chart?.remove()
  chart = null
})
</script>
