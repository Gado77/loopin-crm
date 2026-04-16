<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Assinaturas</h1>
        <p class="text-gray-500 dark:text-gray-400">Gerencie assinaturas recorrentes e contratos dos seus clientes</p>
      </div>
      <UButton color="primary" icon="i-lucide-plus" @click="openModal()">
        Novo Contrato
      </UButton>
    </div>

    <UCard class="bg-white dark:bg-gray-900">
      <UTable :data="contracts" :columns="columns" class="w-full">
        <template #status-cell="{ row }">
          <UBadge :color="getStatusColor(row.original.status)">
            {{ getStatusLabel(row.original.status) }}
          </UBadge>
        </template>
        <template #client-cell="{ row }">
          <div>
            <p class="font-medium">{{ row.original.clients?.name }}</p>
            <p class="text-sm text-gray-500">{{ row.original.clients?.email || '-' }}</p>
          </div>
        </template>
        <template #period-cell="{ row }">
          <div>
            <p>{{ formatDate(row.original.start_date) }}</p>
            <p class="text-sm text-gray-500">até {{ formatDate(row.original.end_date) }}</p>
          </div>
        </template>
        <template #financial-cell="{ row }">
          <div>
            <p class="font-medium">R$ {{ row.original.total_value?.toFixed(2) }}</p>
            <p class="text-sm text-gray-500">{{ row.original.months }}x de R$ {{ row.original.monthly_value?.toFixed(2) }}</p>
          </div>
        </template>
        <template #invoices-cell="{ row }">
          <UBadge variant="soft">{{ getInvoiceCount(row.original.id) }} faturas</UBadge>
        </template>
        <template #actions-cell="{ row }">
          <UButton
            variant="ghost"
            size="sm"
            icon="i-lucide-eye"
            @click="viewContract(row.original)"
          />
        </template>
      </UTable>
    </UCard>

    <!-- Modal Novo Contrato -->
    <UModal v-model:open="isModalOpen">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4">Novo Contrato</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Cliente</label>
              <USelect
                v-model="form.clientId"
                :items="clientOptions"
                placeholder="Selecione o cliente"
                class="w-full"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">Valor Mensal (R$)</label>
              <UInput
                v-model.number="form.monthlyValue"
                type="number"
                placeholder="197"
                class="w-full"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">Quantidade de Meses</label>
              <USelect 
                v-model="form.months" 
                :items="[
                  { label: '1 Mês', value: 1 },
                  { label: '3 Meses', value: 3 },
                  { label: '6 Meses', value: 6 },
                  { label: '12 Meses', value: 12 },
                ]" 
                class="w-full"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">Data de Início</label>
              <UInput
                v-model="form.startDate"
                type="date"
                class="w-full"
              />
            </div>
            
            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p class="text-sm text-gray-500 mb-2">Resumo:</p>
              <p class="font-medium">Total: R$ {{ ((form.monthlyValue || 0) * (form.months || 1)).toFixed(2) }}</p>
              <p class="text-sm text-gray-500">{{ form.months }} parcela(s) de R$ {{ form.monthlyValue }}</p>
            </div>
            
            <div class="flex justify-end gap-3 mt-6">
              <UButton variant="soft" @click="isModalOpen = false">Cancelar</UButton>
              <UButton color="success" :loading="isSubmitting" @click="createContract">
                Criar Contrato
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Modal Ver Contrato com Faturas -->
    <UModal v-model:open="isDetailOpen">
      <template #content>
        <div class="p-6" v-if="selectedContract">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">Assinatura</h3>
            <UBadge :color="getStatusColor(selectedContract.status)">
              {{ getStatusLabel(selectedContract.status) }}
            </UBadge>
          </div>
          
          <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
            <p class="font-medium text-lg">{{ selectedContract.clients?.name }}</p>
            <p class="text-sm text-gray-500">{{ formatDate(selectedContract.start_date) }} até {{ formatDate(selectedContract.end_date) }}</p>
          </div>
          
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p class="text-sm text-gray-500">Valor Mensal</p>
              <p class="font-medium">R$ {{ selectedContract.monthly_value?.toFixed(2) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Valor Total</p>
              <p class="font-medium text-green-600">R$ {{ selectedContract.total_value?.toFixed(2) }}</p>
            </div>
          </div>
          
          <h4 class="font-medium mb-2">Faturas do Contrato</h4>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="invoice in contractInvoices"
              :key="invoice.id"
              class="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <p class="font-medium">R$ {{ invoice.amount?.toFixed(2) }}</p>
                <p class="text-sm text-gray-500">Venc: {{ formatDate(invoice.due_date) }}</p>
              </div>
              <UBadge :color="invoice.status === 'paid' ? 'success' : invoice.status === 'overdue' ? 'error' : 'warning'">
                {{ invoice.status === 'paid' ? 'Pago' : invoice.status === 'overdue' ? 'Atrasado' : 'Pendente' }}
              </UBadge>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const toast = useToast()

const { data: contracts, refresh: refreshContracts } = await useFetch('/api/contracts')
const { data: allInvoices } = await useFetch('/api/invoices')
const { data: clients } = await useFetch('/api/clients')

const isModalOpen = ref(false)
const isDetailOpen = ref(false)
const isSubmitting = ref(false)
const selectedContract = ref<any>(null)
const contractInvoices = ref<any[]>([])

const form = ref({
  clientId: '',
  monthlyValue: 197,
  months: 6,
  startDate: new Date().toISOString().split('T')[0],
})

const columns = [
  { accessorKey: 'client', header: 'Cliente', cell: 'client-cell' },
  { accessorKey: 'period', header: 'Período', cell: 'period-cell' },
  { accessorKey: 'financial', header: 'Valor', cell: 'financial-cell' },
  { accessorKey: 'invoices', header: 'Faturas', cell: 'invoices-cell' },
  { accessorKey: 'status', header: 'Status', cell: 'status-cell' },
  { accessorKey: 'actions', header: '' },
]

const clientOptions = computed(() => {
  if (!clients.value) return []
  return clients.value.map((c: any) => ({
    label: c.name,
    value: c.id,
  }))
})

const formatDate = (date: string) => {
  if (!date) return ''
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(date))
}

const getInvoiceCount = (contractId: string) => {
  if (!allInvoices.value) return 0
  return allInvoices.value.filter((i: any) => i.contract_id === contractId).length
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'completed': return 'info'
    case 'cancelled': return 'error'
    case 'ACTIVE': return 'success'
    case 'INACTIVE': return 'warning'
    case 'SUSPENDED': return 'warning'
    case 'EXPIRED': return 'error'
    default: return 'neutral'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return 'Ativo'
    case 'completed': return 'Concluído'
    case 'cancelled': return 'Cancelado'
    case 'ACTIVE': return 'Ativa'
    case 'INACTIVE': return 'Inativa'
    case 'SUSPENDED': return 'Suspensa'
    case 'EXPIRED': return 'Expirada'
    default: return status
  }
}

const openModal = () => {
  form.value = {
    clientId: '',
    monthlyValue: 197,
    months: 6,
    startDate: new Date().toISOString().split('T')[0],
  }
  isModalOpen.value = true
}

const createContract = async () => {
  if (!form.value.clientId) {
    toast.add({ title: 'Selecione um cliente', color: 'error' })
    return
  }
  
  isSubmitting.value = true
  try {
    await $fetch('/api/contracts', {
      method: 'POST',
      body: {
        clientId: form.value.clientId,
        months: form.value.months,
        startDate: form.value.startDate,
        monthlyValue: form.value.monthlyValue,
      },
    })
    toast.add({ title: 'Contrato criado com sucesso!', color: 'success' })
    isModalOpen.value = false
    refreshContracts()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao criar contrato', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

const viewContract = (contract: any) => {
  selectedContract.value = contract
  contractInvoices.value = (allInvoices.value || []).filter((i: any) => i.contract_id === contract.id)
  isDetailOpen.value = true
}
</script>
