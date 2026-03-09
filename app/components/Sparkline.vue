<template>
  <svg :width="width" :height="height" class="inline-block align-middle">
    <polyline
      :points="points"
      fill="none"
      :stroke="trend >= 0 ? '#ef4444' : '#3b82f6'"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup lang="ts">
// 스파크라인 = 아주 작은 꺾은선 그래프
// SVG의 polyline으로 간단하게 그림

const props = withDefaults(defineProps<{
  data: number[]
  width?: number
  height?: number
}>(), {
  width: 60,
  height: 24,
})

const trend = computed(() => {
  if (props.data.length < 2) return 0
  return props.data[props.data.length - 1] - props.data[0]
})

const points = computed(() => {
  if (!props.data.length) return ''
  const min = Math.min(...props.data)
  const max = Math.max(...props.data)
  const range = max - min || 1
  const stepX = props.width / (props.data.length - 1 || 1)
  const padding = 2

  return props.data
    .map((v, i) => {
      const x = i * stepX
      const y = padding + ((max - v) / range) * (props.height - padding * 2)
      return `${x},${y}`
    })
    .join(' ')
})
</script>
