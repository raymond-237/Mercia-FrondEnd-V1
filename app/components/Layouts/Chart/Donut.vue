<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement)

const props = defineProps<{
  segments: { label: string; value: number; color: string }[]
}>()

const chartData = computed(() => ({
  labels: props.segments.map(s => s.label),
  datasets: [{
    data: props.segments.map(s => s.value),
    backgroundColor: props.segments.map(s => s.color),
    borderWidth: 0,
    hoverOffset: 6,
  }],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '72%',
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1A1210',
      padding: 10,
      cornerRadius: 10,
      bodyFont: { family: 'Inter', size: 12 },
      callbacks: {
        label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed}%`,
      },
    },
  },
}
</script>

<template>
  <div class="donut-wrap">
    <Doughnut :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.donut-wrap { height: 180px; position: relative; }
</style>