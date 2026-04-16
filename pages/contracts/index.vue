<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Assinaturas</h1>
        <p class="text-gray-500 dark:text-gray-400">Gerencie assinaturas do CRM e Asaas</p>
      </div>
      <div class="flex gap-2">
        <UButton variant="soft" icon="i-lucide-refresh-ccw" :loading="isLoadingAsaas" @click="syncAsaasSubscriptions">
          Sincronizar Asaas
        </UButton>
        <UButton color="primary" icon="i-lucide-plus" @click="openModal()">
          Nova Assinatura
        </UButton>
      </div>
    </div>

    <!-- Status Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <UCard>
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ allSubscriptions.length }}</p>
          <p class="text-xs text-gray-500">Total</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-2xl font-bold text-green-600">{{ activeCount }}</p>
          <p class="text-xs text-gray-500">Ativas</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-2xl font-bold text-orange-600">{{ inactiveCount }}</p>
          <p class="text-xs text-gray-500">Inativas</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-2xl font-bold text-purple-600">R$ {{ totalMonthly.toFixed(2) }}</p>
          <p class="text-xs text-gray-500">Receita Mensal</p>
        </div>
      </UCard>
    </div>

    <!-- Tabela de Assinaturas -->
    <UCard class="bg-white dark:bg-gray-900">
      <UTable :data="allSubscriptions" :columns="columns" class="w-full">
        <template #source-cell="{ row }">
          <UBadge :color="row.original.source === 'asaas' ? 'purple' : 'info'" variant="soft" size="sm">
            {{ row.original.source === 'asaas' ? 'Asaas' : 'CRM' }}
          </UBadge>
        </template>
        <template #client-cell="{ row }">
          <div>
            <p class="font-medium">{{ row.original.clientName }}</p>
            <p class="text-sm text-gray-500">{{ row.original.clientEmail || '-' }}</p>
          </div>
        </template>
        <template #description-cell="{ row }">
          <div>
            <p class="font-medium">{{ row.original.description || 'Assinatura' }}</p>
            <p class="text-xs text-gray-500">{{ row.original.cycle }}</p>
          </div>
        </template>
        <template #value-cell="{ row }">
          <div>
            <p class="font-medium">R$ {{ row.original.value?.toFixed(2) }}</p>
            <p class="text-xs text-gray-500">/ {{ row.original.cycle === 'MONTHLY' ? 'mês' : row.original.cycle?.toLowerCase() }}</p>
          </div>
        </template>
        <template #nextDueDate-cell="{ row }">
          <div>
            <p>{{ formatDate(row.original.nextDueDate || row.original.start_date) }}</p>
            <p class="text-xs" :class="isOverdue(row.original.nextDueDate || row.original.start_date) ? 'text-red-500' : 'text-gray-500'">
              {{ isOverdue(row.original.nextDueDate || row.original.start_date) ? 'Atrasado' : 'Próximo' }}
            </p>
          </div>
        </template>
        <template #status-cell="{ row }">
          <UBadge :color="getStatusColor(row.original.status)">
            {{ getStatusLabel(row.original.status) }}
          </UBadge>
        </template>
        <template #actions-cell="{ row }">
          <UDropdown :items="getActions(row.original)">
            <UButton variant="ghost" size="sm" icon="i-lucide-more-vertical" />
          </UDropdown>
        </template>
      </UTable>
    </UCard>

    <!-- Modal Nova Assinatura -->
    <UModal v-model:open="isModalOpen">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4">Nova Assinatura</h3>
          
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
              <label class="block text-sm font-medium mb-1">Descrição</label>
              <UInput
                v-model="form.description"
                placeholder="Ex: Plano Mensal Premium"
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
              <label class="block text-sm font-medium mb-1">Forma de Pagamento</label>
              <USelect
                v-model="form.billingType"
                :items="[
                  { label: 'PIX', value: 'PIX' },
                  { label: 'Boleto', value: 'BOLETO' },
                  { label: 'Cartão de Crédito', value: 'CREDIT_CARD' },
                ]"
                class="w-full"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">Data do Primeiro Vencimento</label>
              <UInput
                v-model="form.nextDueDate"
                type="date"
                class="w-full"
              />
            </div>
            
            <div class="flex justify-end gap-3 mt-6">
              <UButton variant="soft" @click="isModalOpen = false">Cancelar</UButton>
              <UButton color="success" :loading="isSubmitting" @click="createSubscription">
                Criar no Asaas
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Modal Detalhes -->
    <UModal v-model:open="isDetailOpen">
      <template #content>
        <div class="p-6" v-if="selectedSubscription">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">{{ selectedSubscription.description || 'Assinatura' }}</h3>
            <UBadge :color="getStatusColor(selectedSubscription.status)">
              {{ getStatusLabel(selectedSubscription.status) }}
            </UBadge>
          </div>
          
          <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
            <p class="font-medium text-lg">{{ selectedSubscription.clientName }}</p>
            <p class="text-sm text-gray-500">{{ selectedSubscription.source === 'asaas' ? 'Via Asaas' : 'Local CRM' }}</p>
          </div>
          
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p class="text-sm text-gray-500">Valor</p>
              <p class="font-medium text-green-600">R$ {{ selectedSubscription.value?.toFixed(2) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Ciclo</p>
              <p class="font-medium">{{ selectedSubscription.cycle }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Próximo Vencimento</p>
              <p class="font-medium">{{ formatDate(selectedSubscription.nextDueDate || selectedSubscription.start_date) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">ID Asaas</p>
              <p class="font-medium text-xs font-mono">{{ selectedSubscription.asaasId || '-' }}</p>
            </div>
          </div>

          <div v-if="selectedSubscription.asaasId" class="flex gap-2">
            <UButton variant="soft" size="sm" @click="resendNotification(selectedSubscription.asaasId)">
              Reenviar Notificação
            </UButton>
            <UButton v-if="selectedSubscription.status === 'ACTIVE'" variant="soft" color="error" size="sm" @click="cancelSubscription(selectedSubscription)">
              Cancelar
            </UButton>
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
const { data: clients } = await useFetch('/api/clients')

const isModalOpen = ref(false)
const isDetailOpen = ref(false)
const isSubmitting = ref(false)
const isLoadingAsaas = ref(false)
const selectedSubscription = ref<any>(null)
const asaasSubscriptions = ref<any[]>([])

const form = ref({
  clientId: '',
  description: '',
  monthlyValue: 197,
  billingType: 'PIX',
  nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
})

const columns = [
  { accessorKey: 'source', header: '', cell: 'source-cell', size: 70 },
  { accessorKey: 'client', header: 'Cliente', cell: 'client-cell' },
  { accessorKey: 'description', header: 'Descrição', cell: 'description-cell' },
  { accessorKey: 'value', header: 'Valor', cell: 'value-cell', size: 120 },
  { accessorKey: 'nextDueDate', header: 'Vencimento', cell: 'nextDueDate-cell', size: 140 },
  { accessorKey: 'status', header: 'Status', cell: 'status-cell', size: 100 },
  { accessorKey: 'actions', header: '', cell: 'actions-cell', size: 60 },
]

const allSubscriptions = computed(() => {
  const local = (contracts.value || []).map((c: any) => ({
    id: c.id,
    source: 'crm',
    sourceId: c.id,
    clientId: c.client_id,
    clientName: c.clients?.name || 'Cliente não encontrado',
    clientEmail: c.clients?.email || '',
    description: c.name,
    value: c.monthly_value,
    cycle: 'MONTHLY',
    nextDueDate: null,
    startDate: c.start_date,
    status: c.status,
    asaasId: c.asaas_subscription_id || null,
  }))

  return [...local, ...asaasSubscriptions.value]
})

const activeCount = computed(() => {
  return allSubscriptions.value.filter(s => s.status === 'ACTIVE' || s.status === 'active').length
})

const inactiveCount = computed(() => {
  return allSubscriptions.value.filter(s => s.status === 'INACTIVE' || s.status === 'SUSPENDED' || s.status === 'EXPIRED').length
})

const totalMonthly = computed(() => {
  return allSubscriptions.value
    .filter(s => s.status === 'ACTIVE' || s.status === 'active')
    .reduce((sum, s) => sum + (s.value || 0), 0)
})

const clientOptions = computed(() => {
  if (!clients.value) return []
  return clients.value.map((c: any) => ({
    label: c.name + (c.email ? ` (${c.email})` : ''),
    value: c.id,
  }))
})

const formatDate = (date: string) => {
  if (!date) return '-'
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(date))
}

const isOverdue = (date: string) => {
  if (!date) return false
  return new Date(date) < new Date()
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
    case 'ACTIVE': return 'success'
    case 'completed': return 'info'
    case 'cancelled':
    case 'CANCELLED': return 'error'
    case 'INACTIVE':
    case 'SUSPENDED':
    case 'EXPIRED': return 'warning'
    default: return 'neutral'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': return 'Ativo'
    case 'ACTIVE': return 'Ativa'
    case 'completed': return 'Concluído'
    case 'cancelled':
    case 'CANCELLED': return 'Cancelada'
    case 'INACTIVE': return 'Inativa'
    case 'SUSPENDED': return 'Suspensa'
    case 'EXPIRED': return 'Expirada'
    default: return status
  }
}

const getActions = (subscription: any) => {
  const items = [
    [{
      label: 'Ver Detalhes',
      icon: 'i-lucide-eye',
      click: () => viewSubscription(subscription)
    }]
  ]

  if (subscription.source === 'asaas' && subscription.asaasId) {
    items[0].push({
      label: 'Reenviar Notificação',
      icon: 'i-lucide-mail',
      click: () => resendNotification(subscription.asaasId)
    })
    
    if (subscription.status === 'ACTIVE') {
      items[0].push({
        label: 'Cancelar Assinatura',
        icon: 'i-lucide-x-circle',
        color: 'red',
        click: () => cancelSubscription(subscription)
      })
    }
  }

  return items
}

const syncAsaasSubscriptions = async () => {
  isLoadingAsaas.value = true
  try {
    const result = await $fetch('/api/asaas/import-subscriptions')
    asaasSubscriptions.value = (result.subscriptions || []).map((s: any) => {
      const client = (clients.value || []).find((c: any) => c.asaas_customer_id === s.customer)
      return {
        id: s.id,
        source: 'asaas',
        sourceId: s.id,
        clientId: client?.id || null,
        clientName: client?.name || s.customer,
        clientEmail: client?.email || '',
        description: s.description,
        value: s.value,
        cycle: s.cycle,
        nextDueDate: s.nextDueDate,
        startDate: s.nextDueDate,
        status: s.status,
        asaasId: s.id,
      }
    })
    toast.add({ title: `${asaasSubscriptions.value.length} assinaturas carregadas do Asaas`, color: 'success' })
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao sincronizar', color: 'error' })
  } finally {
    isLoadingAsaas.value = false
  }
}

const openModal = () => {
  form.value = {
    clientId: '',
    description: '',
    monthlyValue: 197,
    billingType: 'PIX',
    nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }
  isModalOpen.value = true
}

const createSubscription = async () => {
  if (!form.value.clientId || !form.value.monthlyValue) {
    toast.add({ title: 'Preencha todos os campos', color: 'error' })
    return
  }
  
  isSubmitting.value = true
  try {
    const result = await $fetch('/api/asaas/create-subscription', {
      method: 'POST',
      body: {
        clientId: form.value.clientId,
        value: form.value.monthlyValue,
        billingType: form.value.billingType,
        cycle: 'MONTHLY',
        nextDueDate: form.value.nextDueDate,
        description: form.value.description || 'Assinatura Loopin',
      },
    })
    toast.add({ title: 'Assinatura criada no Asaas!', color: 'success' })
    isModalOpen.value = false
    refreshContracts()
    syncAsaasSubscriptions()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao criar assinatura', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

const viewSubscription = (subscription: any) => {
  selectedSubscription.value = subscription
  isDetailOpen.value = true
}

const resendNotification = async (asaasId: string) => {
  try {
    await $fetch('/api/asaas/resend-payment', {
      method: 'POST',
      body: { paymentId: asaasId }
    })
    toast.add({ title: 'Notificação reenviada!', color: 'success' })
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao reenviar', color: 'error' })
  }
}

const cancelSubscription = async (subscription: any) => {
  if (!confirm('Deseja cancelar esta assinatura?')) return
  
  try {
    await $fetch('/api/asaas/cancel-subscription', {
      method: 'POST',
      body: { subscriptionId: subscription.asaasId }
    })
    toast.add({ title: 'Assinatura cancelada!', color: 'success' })
    syncAsaasSubscriptions()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao cancelar', color: 'error' })
  }
}
</script>
