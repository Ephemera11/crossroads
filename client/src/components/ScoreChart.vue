<template>
  <div class="score-chart" ref="chartRef"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import type { ScoreItem } from '../types'

const props = defineProps<{ scores: ScoreItem[] }>()
const chartRef = ref<HTMLDivElement>()

let chart: echarts.ECharts | null = null

function renderChart() {
  if (!chartRef.value) return

  if (!chart) {
    chart = echarts.init(chartRef.value, 'dark')
  }

  const experts = [...new Set(props.scores.map(s => s.expert))]
  const options = [...new Set(props.scores.map(s => s.option))]

  const series = experts.map((expert, idx) => {
    const expertScores = props.scores.filter(s => s.expert === expert)
    const colors = ['#4a9eff', '#4ade80', '#fbbf24', '#f472b6', '#a78bfa']

    return {
      name: expert,
      type: 'bar' as const,
      data: options.map(opt => {
        const item = expertScores.find(s => s.option === opt)
        return item ? item.score : 0
      }),
      itemStyle: {
        color: colors[idx % colors.length],
        borderRadius: [6, 6, 0, 0],
      },
      barGap: '20%',
    }
  })

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      top: 0,
      textStyle: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 40,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: options,
      axisLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 10,
      axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
    },
    series,
  })
}

onMounted(() => renderChart())
watch(() => props.scores, () => renderChart(), { deep: true })
</script>

<style scoped>
.score-chart {
  width: 100%;
  height: 300px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}
</style>