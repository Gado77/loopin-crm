<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Despesas</h1>
        <p class="text-gray-500 dark:text-gray-400">Controle de gastos do negócio</p>
      </div>
      <UButton color="primary" icon="i-lucide-plus" @click="openModal()">
        Nova Despesa
      </UButton>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <UCard class="bg-white dark:bg-gray-900">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Despesas do Mês</p>
            <p class="text-2xl font-bold text-red-600">
              {{ formatCurrency(stats?.monthExpenses || 0) }}
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
            <p class="text-sm text-gray-500 dark:text-gray-400">Total de Despesas</p>
            <p class="text-2xl font-bold text-orange-600">
              {{ formatCurrency(stats?.totalExpenses || 0) }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <UIcon name="i-lucide-wallet" class="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </UCard>
    </div>

    <div class="mb-6">
      <UCard class="bg-white dark:bg-gray-900">
        <UTable :data="transactions || []" :columns="columns" class="w-full">
          <template #categoryName-cell="{ row }">
            {{ row.original.categoryName || '-' }}
          </template>
          <template #actions-cell="{ row }">
            <div class="flex items-center gap-2">
              <UButton
                variant="ghost"
                size="sm"
                icon="i-lucide-pencil"
                @click="openModal(row.original)"
              />
              <UButton
                variant="ghost"
                color="error"
                size="sm"
                icon="i-lucide-trash-2"
                @click="confirmDelete(row.original)"
              />
            </div>
          </template>
        </UTable>
      </UCard>
    </div>

    <div class="mb-6">
      <UCard class="bg-white dark:bg-gray-900">
        <div class="p-4">
          <h3 class="text-lg font-semibold mb-4">Despesas por Mês</h3>
          <div class="h-64">
            <canvas ref="expensesChart"></canvas>
          </div>
        </div>
      </UCard>
    </div>

    <UModal v-model:open="isModalOpen">
      <template #content>
        <div class="p-6 max-h-[90vh] overflow-y-auto">
          <h3 class="text-lg font-semibold mb-4">{{ editingTransaction ? 'Editar Despesa' : 'Nova Despesa' }}</h3>
          <UForm :state="formState" :schema="schema" @submit="handleSubmit" class="space-y-4">
            <UFormField label="Categoria" name="categoryId">
              <USelect
                v-model="formState.categoryId"
                :items="categoryOptions"
                placeholder="Selecione a categoria"
              />
            </UFormField>

            <UFormField label="Descrição" name="description">
              <UInput v-model="formState.description" placeholder="Descrição da despesa" />
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
        </div>
      </template>
    </UModal>

    <UModal v-model:open="isDeleteOpen">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4">Confirmar Exclusão</h3>
          <p class="text-gray-600 dark:text-gray-300">
            Tem certeza que deseja excluir esta despesa?
          </p>
          <div class="flex justify-end gap-3 mt-6">
            <UButton variant="soft" @click="isDeleteOpen = false">Cancelar</UButton>
            <UButton color="error" :loading="isDeleting" @click="handleDelete">Excluir</UButton>
          </div>
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
const expensesChart = ref<HTMLCanvasElement>()

const schema = z.object({
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  date: z.string().min(1, 'Data é obrigatória'),
})

type FormState = z.infer<typeof schema>

const isModalOpen = ref(false)
const isDeleteOpen = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const editingTransaction = ref<any>(null)
const transactionToDelete = ref<any>(null)

const formState = reactive<FormState>({
  categoryId: '',
  description: '',
  amount: 0,
  date: new Date().toISOString().split('T')[0],
})

const { data: transactions, refresh: refreshTransactions } = await useFetch('/api/financial')
const { data: categories } = await useFetch('/api/financial/categories')
const { data: stats } = await useFetch('/api/financial/stats')
const { data: cashFlow } = await useFetch('/api/financial/cashflow')

const categoryOptions = computed(() => {
  if (!categories.value) return []
  return categories.value.map((c: any) => ({
    label: c.name,
    value: c.id,
  }))
})

const columns = [
  { accessorKey: 'date', header: 'Data', cell: ({ row }: any) => formatDate(row.original.date) },
  { accessorKey: 'categoryName', header: 'Categoria' },
  { accessorKey: 'description', header: 'Descrição' },
  { accessorKey: 'amount', header: 'Valor', cell: ({ row }: any) => 
    h('span', { class: 'text-red-600' }, `R$ ${(row.original.amount || 0).toFixed(2)}`)
  },
  { accessorKey: 'actions' },
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
    formState.categoryId = transaction.category_id || ''
    formState.description = transaction.description
    formState.amount = transaction.amount
    formState.date = transaction.date
  } else {
    editingTransaction.value = null
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
      toast.add({ title: 'Despesa atualizada!', color: 'success' })
    } else {
      await $fetch('/api/financial', {
        method: 'POST',
        body: formState,
      })
      toast.add({ title: 'Despesa criada!', color: 'success' })
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
    toast.add({ title: 'Despesa excluída!', color: 'success' })
    isDeleteOpen.value = false
    refreshTransactions()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao excluir', color: 'error' })
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  if (expensesChart.value && cashFlow.value) {
    new Chart(expensesChart.value, {
      type: 'bar',
      data: {
        labels: cashFlow.value.labels,
        datasets: [
          {
            label: 'Despesas',
            data: cashFlow.value.expenses,
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 1,
          },
        ],
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
