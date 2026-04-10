<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Financeiro</h1>
        <p class="text-gray-500 dark:text-gray-400">Controle de despesas e fluxo de caixa</p>
      </div>
      <UButton color="primary" icon="i-lucide-plus" @click="openModal()">
        Nova Transação
      </UButton>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <UCard class="bg-white dark:bg-gray-900">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Entradas do Mês</p>
            <p class="text-2xl font-bold text-green-600">
              {{ formatCurrency(stats.monthIncome) }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <UIcon name="i-lucide-trending-up" class="w-6 h-6 text-green-600" />
          </div>
        </div>
      </UCard>

      <UCard class="bg-white dark:bg-gray-900">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Despesas do Mês</p>
            <p class="text-2xl font-bold text-red-600">
              {{ formatCurrency(stats.monthExpenses) }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <UIcon name="i-lucide-trending-down" class="w-6 h-6 text-red-600" />
          </div>
        </div>
      </UCard>

      <UCard class="bg-white dark:bg-gray-900">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Saldo do Mês</p>
            <p class="text-2xl font-bold" :class="stats.monthBalance >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ formatCurrency(stats.monthBalance) }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <UIcon name="i-lucide-wallet" class="w-6 h-6 text-indigo-600" />
          </div>
        </div>
      </UCard>
    </div>

    <UTabs :items="tabs" class="mb-6">
      <template #transactions>
        <UCard class="bg-white dark:bg-gray-900">
          <UTable :data="transactions" :columns="columns" class="w-full">
            <template #type="{ row }">
              <UBadge :color="row.type === 'income' ? 'success' : 'error'">
                {{ row.type === 'income' ? 'Entrada' : 'Despesa' }}
              </UBadge>
            </template>
            <template #categoryName="{ row }">
              {{ row.categoryName || '-' }}
            </template>
            <template #actions="{ row }">
              <div class="flex items-center gap-2">
                <UButton
                  variant="ghost"
                  size="sm"
                  icon="i-lucide-pencil"
                  @click="openModal(row)"
                />
                <UButton
                  variant="ghost"
                  color="error"
                  size="sm"
                  icon="i-lucide-trash-2"
                  @click="confirmDelete(row)"
                />
              </div>
            </template>
          </UTable>
        </UCard>
      </template>

      <template #cashflow>
        <UCard class="bg-white dark:bg-gray-900">
          <div class="h-80">
            <canvas ref="cashFlowChart"></canvas>
          </div>
        </UCard>
      </template>
    </UTabs>

    <UModal v-model:open="isModalOpen" :title="editingTransaction ? 'Editar Transação' : 'Nova Transação'">
      <UForm :state="formState" :schema="schema" @submit="handleSubmit" class="space-y-4">
        <UFormField label="Tipo" name="type">
          <USelect
            v-model="formState.type"
            :items="typeOptions"
          />
        </UFormField>

        <UFormField label="Categoria" name="categoryId">
          <USelect
            v-model="formState.categoryId"
            :items="categoryOptions"
            placeholder="Selecione a categoria"
          />
        </UFormField>

        <UFormField label="Descrição" name="description">
          <UInput v-model="formState.description" placeholder="Descrição da transação" />
        </UFormField>

        <UFormField label="Valor (R$)" name="amount">
          <UInput
            v-model.number="formState.amount"
            type="number"
            step="0.01"
            placeholder="0.00"
          />
        </UFormField>

        <UFormField label="Data" name="date">
          <UInput
            v-model="formState.date"
            type="date"
          />
        </UFormField>

        <div class="flex justify-end gap-3 pt-4">
          <UButton variant="soft" @click="isModalOpen = false">
            Cancelar
          </UButton>
          <UButton type="submit" color="primary" :loading="isSubmitting">
            Salvar
          </UButton>
        </div>
      </UForm>
    </UModal>

    <UModal v-model:open="isDeleteOpen" title="Confirmar Exclusão">
      <p class="text-gray-600 dark:text-gray-300">
        Tem certeza que deseja excluir esta transação?
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="soft" @click="isDeleteOpen = false">Cancelar</UButton>
          <UButton color="error" :loading="isDeleting" @click="handleDelete">Excluir</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

definePageMeta({
  middleware: 'auth',
})

const toast = useToast()
const cashFlowChart = ref<HTMLCanvasElement>()

const tabs = [
  { label: 'Transações', slot: 'transactions' },
  { label: 'Fluxo de Caixa', slot: 'cashflow' },
]

const schema = z.object({
  type: z.enum(['income', 'expense']),
  categoryId: z.string().optional(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  date: z.string().min(1, 'Data é obrigatória'),
})

type FormState = z.infer<typeof schema>

const search = ref('')
const isModalOpen = ref(false)
const isDeleteOpen = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const editingTransaction = ref<any>(null)
const transactionToDelete = ref<any>(null)

const formState = reactive<FormState>({
  type: 'expense',
  categoryId: '',
  description: '',
  amount: 0,
  date: new Date().toISOString().split('T')[0],
})

const { data: transactions, refresh: refreshTransactions } = await useFetch('/api/financial')
const { data: categories } = await useFetch('/api/financial/categories')
const { data: stats } = await useFetch('/api/financial/stats')
const { data: cashFlow } = await useFetch('/api/financial/cashflow')

const typeOptions = [
  { label: 'Entrada', value: 'income' },
  { label: 'Despesa', value: 'expense' },
]

const categoryOptions = computed(() => {
  if (!categories.value) return []
  return categories.value.map((c: any) => ({
    label: c.name,
    value: c.id,
  }))
})

const columns = [
  { accessorKey: 'date', header: 'Data', cell: (row: any) => formatDate(row.date) },
  { accessorKey: 'type', header: 'Tipo' },
  { accessorKey: 'description', header: 'Descrição' },
  { accessorKey: 'categoryName', header: 'Categoria' },
  { accessorKey: 'amount', header: 'Valor', cell: (row: any) => {
    const color = row.type === 'income' ? 'text-green-600' : 'text-red-600'
    const prefix = row.type === 'income' ? '+' : '-'
    return h('span', { class: color }, `${prefix} R$ ${(row.amount || 0).toFixed(2)}`)
  }},
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

const openModal = (transaction?: any) => {
  if (transaction) {
    editingTransaction.value = transaction
    formState.type = transaction.type
    formState.categoryId = transaction.category_id || ''
    formState.description = transaction.description
    formState.amount = transaction.amount
    formState.date = transaction.date
  } else {
    editingTransaction.value = null
    formState.type = 'expense'
    formState.categoryId = ''
    formState.description = ''
    formState.amount = 0
    formState.date = new Date().toISOString().split('T')[0]
  }
  isModalOpen.value = true
}

const confirmDelete = (transaction: any) => {
  transactionToDelete.value = transaction
  isDeleteOpen.value = true
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    if (editingTransaction.value) {
      await $fetch(`/api/financial/${editingTransaction.value.id}`, {
        method: 'PUT',
        body: formState,
      })
      toast.add({ title: 'Transação atualizada!', color: 'success' })
    } else {
      await $fetch('/api/financial', {
        method: 'POST',
        body: formState,
      })
      toast.add({ title: 'Transação criada!', color: 'success' })
    }
    isModalOpen.value = false
    refreshTransactions()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao salvar', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async () => {
  isDeleting.value = true
  try {
    await $fetch(`/api/financial/${transactionToDelete.value.id}`, {
      method: 'DELETE',
    })
    toast.add({ title: 'Transação excluída!', color: 'success' })
    isDeleteOpen.value = false
    refreshTransactions()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao excluir', color: 'error' })
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  if (cashFlowChart.value && cashFlow.value) {
    new Chart(cashFlowChart.value, {
      type: 'line',
      data: {
        labels: cashFlow.value.labels,
        datasets: [
          {
            label: 'Entradas',
            data: cashFlow.value.income,
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
          },
          {
            label: 'Despesas',
            data: cashFlow.value.expenses,
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
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
