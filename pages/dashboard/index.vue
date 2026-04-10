<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      <p class="text-gray-500 dark:text-gray-400">Visão geral do seu negócio</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <UCard class="bg-white dark:bg-gray-900">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Total a Receber</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ formatCurrency(stats.totalReceivable) }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <UIcon name="i-lucide-receipt" class="w-6 h-6 text-indigo-600" />
          </div>
        </div>
      </UCard>

      <UCard class="bg-white dark:bg-gray-900">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Faturas em Atraso</p>
            <p class="text-2xl font-bold text-amber-600">
              {{ stats.overdueInvoices }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <UIcon name="i-lucide-alert-circle" class="w-6 h-6 text-amber-600" />
          </div>
        </div>
      </UCard>

      <UCard class="bg-white dark:bg-gray-900">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Inadimplência</p>
            <p class="text-2xl font-bold" :class="stats.overduePercentage > 20 ? 'text-red-600' : 'text-green-600'">
              {{ stats.overduePercentage }}%
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <UIcon name="i-lucide-trending-up" class="w-6 h-6 text-red-600" />
          </div>
        </div>
      </UCard>

      <UCard class="bg-white dark:bg-gray-900">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Total de Clientes</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ stats.totalClients }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <UIcon name="i-lucide-users" class="w-6 h-6 text-green-600" />
          </div>
        </div>
      </UCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <UCard class="bg-white dark:bg-gray-900">
        <template #header>
          <h2 class="font-semibold text-gray-900 dark:text-white">Faturamento Mensal</h2>
        </template>
        <div class="h-64">
          <canvas ref="revenueChart"></canvas>
        </div>
      </UCard>

      <UCard class="bg-white dark:bg-gray-900">
        <template #header>
          <h2 class="font-semibold text-gray-900 dark:text-white">Próximos Vencimentos</h2>
        </template>
        <div class="space-y-3">
          <div v-if="upcomingInvoices.length === 0" class="text-center py-8 text-gray-500">
            Nenhum vencimento próximo
          </div>
          <div
            v-for="invoice in upcomingInvoices"
            :key="invoice.id"
            class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
          >
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ invoice.clientName }}</p>
              <p class="text-sm text-gray-500">{{ invoice.establishmentName }}</p>
            </div>
            <div class="text-right">
              <p class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(invoice.amount) }}</p>
              <p class="text-sm text-amber-600">{{ formatDate(invoice.dueDate) }}</p>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <UCard class="bg-white dark:bg-gray-900">
        <template #header>
          <h2 class="font-semibold text-gray-900 dark:text-white">Faturas Recentes</h2>
        </template>
        <div class="overflow-x-auto">
          <UTable :data="recentInvoices" :columns="invoiceColumns" />
        </div>
      </UCard>

      <UCard class="bg-white dark:bg-gray-900">
        <template #header>
          <h2 class="font-semibold text-gray-900 dark:text-white">Despesas do Mês</h2>
        </template>
        <div class="space-y-3">
          <div v-if="expensesByCategory.length === 0" class="text-center py-8 text-gray-500">
            Nenhuma despesa registrada
          </div>
          <div
            v-for="expense in expensesByCategory"
            :key="expense.category"
            class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <UIcon name="i-lucide-tag" class="w-4 h-4 text-red-600" />
              </div>
              <span class="text-gray-900 dark:text-white">{{ expense.category }}</span>
            </div>
            <span class="font-medium text-red-600">{{ formatCurrency(expense.amount) }}</span>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Chart, registerables } from 'chart.js'
import { Bar } from 'vue-chartjs'

Chart.register(...registerables)

definePageMeta({
  middleware: 'auth',
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

const { data: stats } = await useFetch('/api/dashboard/stats')
const { data: monthlyRevenue } = await useFetch('/api/dashboard/monthly-revenue')
const { data: upcomingInvoices } = await useFetch('/api/dashboard/upcoming-invoices')
const { data: recentInvoices } = await useFetch('/api/dashboard/recent-invoices')
const { data: expensesByCategory } = await useFetch('/api/dashboard/expenses-by-category')

const revenueChart = ref<HTMLCanvasElement>()

const invoiceColumns = [
  { accessorKey: 'clientName', header: 'Cliente' },
  { accessorKey: 'amount', header: 'Valor', cell: (row: any) => formatCurrency(row.amount) },
  { accessorKey: 'dueDate', header: 'Vencimento', cell: (row: any) => formatDate(row.dueDate) },
  { accessorKey: 'status', header: 'Status', cell: (row: any) => {
    const colors: Record<string, string> = {
      pending: 'warning',
      paid: 'success',
      overdue: 'error',
      cancelled: 'neutral',
      barter: 'info',
    }
    return h(UBadge, { color: colors[row.status] || 'neutral' }, () => row.status)
  }},
]

onMounted(() => {
  if (revenueChart.value && monthlyRevenue.value) {
    new Chart(revenueChart.value, {
      type: 'bar',
      data: {
        labels: monthlyRevenue.value.labels,
        datasets: [{
          label: 'Faturamento',
          data: monthlyRevenue.value.data,
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderRadius: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `R$ ${value}`,
            },
          },
        },
      },
    })
  }
})
</script>
