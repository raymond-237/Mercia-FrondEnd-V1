<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS, Title, Tooltip, Legend,
  LineElement, PointElement, LinearScale, CategoryScale, Filler,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, Filler)

const props = defineProps<{
  labels: string[]
  values: number[]
}>()

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      label: 'Chiffre d\'affaires',
      data: props.values,
      borderColor: '#C68A52',
      backgroundColor: 'rgba(198, 138, 82, 0.08)',
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: '#C68A52',
      pointHoverBorderColor: '#FAFAF8',
      pointHoverBorderWidth: 2,
      borderWidth: 2.5,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1A1210',
      padding: 12,
      titleFont: { family: 'Inter', size: 12, weight: 700 as const },
      bodyFont: { family: 'Inter', size: 12 },
      cornerRadius: 10,
      displayColors: false,
      callbacks: {
        label: (ctx: any) => `${ctx.parsed.y.toLocaleString('fr-FR')}€`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } },
    y: {
      grid: { color: 'rgba(0,0,0,0.04)' },
      ticks: {
        font: { family: 'Inter', size: 11 },
        callback: (v: number) => `${v / 1000}K`,
      },
    },
  },
}
</script>

<template>
  <div class="chart-wrap">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.chart-wrap { height: 220px; position: relative; }
</style>