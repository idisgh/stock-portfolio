<template>
  <div class="relative">
    <input
      ref="inputEl"
      :value="searchQuery"
      @input="onNativeInput"
      @compositionstart="composing = true"
      @compositionend="onCompositionEnd"
      @focus="onFocus"
      @keydown.down.prevent="moveSelection(1)"
      @keydown.up.prevent="moveSelection(-1)"
      @keydown.enter.prevent="selectCurrent"
      @keydown.escape="closeDropdown"
      placeholder="종목 검색 (TSLA, 삼성전자...)"
      class="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
    />

    <!-- 드롭다운 -->
    <div v-if="showDropdown && results.length"
      class="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-xl max-h-72 overflow-y-auto">
      <div
        v-for="(item, i) in results"
        :key="item.ticker"
        @mousedown.prevent="selectItem(item)"
        :class="i === selectedIndex ? 'bg-gray-600' : 'hover:bg-gray-600'"
        class="px-3 py-2 cursor-pointer transition flex items-center justify-between"
      >
        <div>
          <span class="font-medium text-sm text-white">{{ item.ticker }}</span>
          <span class="text-gray-400 text-xs ml-2">{{ item.name }}</span>
        </div>
        <span class="text-xs px-1.5 py-0.5 rounded font-medium"
          :class="item.type === 'KR' ? 'bg-blue-900/50 text-blue-300' : 'bg-red-900/50 text-red-300'">
          {{ item.type === 'KR' ? 'KR' : 'US' }}
        </span>
      </div>
    </div>

    <!-- 로딩 -->
    <div v-if="showDropdown && loading"
      class="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-400 text-sm">
      검색 중...
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  select: [item: { ticker: string, name: string, type: string }]
}>()

const inputEl = ref<HTMLInputElement>()
const searchQuery = ref('')
const results = ref<any[]>([])
const loading = ref(false)
const showDropdown = ref(false)
const selectedIndex = ref(-1)
const composing = ref(false)  // 한글 IME 조합 중인지

let debounceTimer: any = null

// 영문 등 일반 입력
function onNativeInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  searchQuery.value = val
  if (!composing.value) {
    triggerSearch()
  }
}

// 한글 조합 완료 시
function onCompositionEnd(e: Event) {
  composing.value = false
  const val = (e.target as HTMLInputElement).value
  searchQuery.value = val
  triggerSearch()
}

function onFocus() {
  showDropdown.value = true
  if (!searchQuery.value) fetchResults()
}

function triggerSearch() {
  selectedIndex.value = -1
  showDropdown.value = true
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => fetchResults(), 300)
}

async function fetchResults() {
  const q = searchQuery.value.trim()

  loading.value = true
  try {
    results.value = await $fetch(`/api/search?q=${encodeURIComponent(q)}`)
  } catch {
    results.value = []
  } finally {
    loading.value = false
  }
}

function moveSelection(dir: number) {
  const len = results.value.length
  if (!len) return
  selectedIndex.value = (selectedIndex.value + dir + len) % len
}

function selectCurrent() {
  if (selectedIndex.value >= 0 && results.value[selectedIndex.value]) {
    selectItem(results.value[selectedIndex.value])
  }
}

function selectItem(item: any) {
  emit('select', item)
  searchQuery.value = ''
  results.value = []
  showDropdown.value = false
  if (inputEl.value) inputEl.value.value = ''
}

function closeDropdown() {
  showDropdown.value = false
}

// 외부 클릭 시 닫기
onMounted(() => {
  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement)
    if (!el.closest('.relative')) {
      showDropdown.value = false
    }
  })
})
</script>
