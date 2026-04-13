<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Clientes (Anunciantes)</h1>
        <p class="text-gray-500 dark:text-gray-400">Gerencie marcas e anunciantes da sua rede</p>
      </div>
      <div class="flex gap-2">
        <UButton variant="soft" icon="i-lucide-refresh-ccw" :loading="isSyncing" @click="syncFromLoopin()">
          Sincronizar
        </UButton>
        <UButton color="primary" icon="i-lucide-plus" @click="openModal()">
          Novo Anunciante
        </UButton>
      </div>
    </div>

    <UCard class="bg-white dark:bg-gray-900">
      <div class="flex items-center gap-4 mb-4">
        <UInput
          v-model="search"
          placeholder="Buscar anunciante..."
          icon="i-lucide-search"
          class="max-w-xs"
        />
        <USelect
          v-model="filterStatus"
          :items="statusOptions"
          placeholder="Status"
        />
      </div>

      <UTable :data="filteredClients" :columns="columns" class="w-full">
        <template #status-cell="{ row }">
          <UBadge :color="getStatusColor(row.original.status)">{{ getStatusLabel(row.original.status) }}</UBadge>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex items-center gap-2">
            <UButton
              variant="ghost"
              color="primary"
              size="sm"
              icon="i-lucide-eye"
              @click="viewClient(row.original)"
            />
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

    <UModal v-model:open="isModalOpen">
      <template #content>
        <div class="p-6 max-h-[90vh] overflow-y-auto">
          <h3 class="text-lg font-semibold mb-6">{{ editingClient ? 'Editar Anunciante' : 'Novo Anunciante' }}</h3>
          <UForm :state="formState" :schema="schema" @submit="handleSubmit" class="space-y-6">
            
            <div class="space-y-4">
              <h4 class="font-medium text-gray-900 dark:text-white border-b pb-2">Informações da Empresa</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField label="Nome da Marca/Empresa" name="name">
                  <UInput v-model="formState.name" placeholder="Ex: Burguer King" />
                </UFormField>

                <UFormField label="Segmento" name="segment">
                  <UInput v-model="formState.segment" placeholder="Ex: Restaurante, Estética" />
                </UFormField>

                <UFormField label="Email" name="email">
                  <UInput v-model="formState.email" type="email" placeholder="email@exemplo.com" />
                </UFormField>

                <UFormField label="Telefone / WhatsApp" name="phone">
                  <UInput v-model="formState.phone" placeholder="(11) 99999-9999" />
                </UFormField>

                <UFormField label="Documento (CNPJ/CPF)" name="document">
                  <UInput v-model="formState.document" placeholder="00.000.000/0001-00" />
                </UFormField>
                
                <UFormField label="Nome do Contato" name="contactName">
                  <UInput v-model="formState.contactName" placeholder="Pessoa responsável pelo contato" />
                </UFormField>

                <UFormField label="Endereço" name="address">
                  <UInput v-model="formState.address" placeholder="Endereço completo" />
                </UFormField>
              </div>
            </div>

            <div class="space-y-4">
              <h4 class="font-medium text-gray-900 dark:text-white border-b pb-2">Dados Comerciais</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField label="Plano Contratado" name="planType">
                  <UInput v-model="formState.planType" placeholder="Ex: Plano 5 Telas" />
                </UFormField>

                <UFormField label="Valor Mensal (R$)" name="monthlyFee">
                  <UInput
                    v-model.number="formState.monthlyFee"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                  />
                </UFormField>

                <UFormField label="Data de Início" name="startDate">
                  <UInput v-model="formState.startDate" type="date" />
                </UFormField>

                <UFormField label="Renovação" name="renewalDate">
                  <UInput v-model="formState.renewalDate" type="date" />
                </UFormField>
                
                <UFormField label="Origem do Cliente" name="leadSource">
                  <UInput v-model="formState.leadSource" placeholder="Ex: Instagram, Indicação" />
                </UFormField>

                <UFormField label="Status" name="status">
                  <USelect v-model="formState.status" :items="statusOptions.filter(o => o.value !== 'all')" />
                </UFormField>
              </div>
            </div>

            <div class="space-y-4">
              <h4 class="font-medium text-gray-900 dark:text-white border-b pb-2">Financeiro e Obs</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField label="Dias de Tolerância" name="graceDays">
                  <UInput v-model.number="formState.graceDays" type="number" placeholder="30" />
                  <template #description>Dias pós-vencimento para inadimplência</template>
                </UFormField>
              </div>
              <UFormField label="Observações de Venda" name="notes">
                <UTextarea v-model="formState.notes" :rows="3" placeholder="Informações críticas do contato" />
              </UFormField>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <UButton variant="soft" @click="isModalOpen = false">Cancelar</UButton>
              <UButton type="submit" color="primary" :loading="isSubmitting">Salvar Anunciante</UButton>
            </div>
          </UForm>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="isDetailOpen">
      <template #content>
        <div class="p-6 max-h-[90vh] overflow-y-auto w-[600px] max-w-full">
          <h3 class="text-lg font-semibold mb-4">Visão 360 do Anunciante</h3>
          <div v-if="selectedClient" class="space-y-6">
            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-500">Empresa</p>
                <p class="font-medium text-lg">{{ selectedClient.name }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Contato</p>
                <p class="font-medium">{{ selectedClient.contact_name || '-' }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Segmento</p>
                <p class="font-medium">{{ selectedClient.segment || '-' }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Email</p>
                <p class="font-medium">{{ selectedClient.email || '-' }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Telefone / Whats</p>
                <p class="font-medium">{{ selectedClient.phone || '-' }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Plano Atual</p>
                <p class="font-medium">{{ selectedClient.plan_type || '-' }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Mensalidade</p>
                <p class="font-medium text-green-600">R$ {{ (selectedClient.monthly_fee || 0).toFixed(2) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Renovação</p>
                <p class="font-medium">{{ selectedClient.renewal_date ? formatDate(selectedClient.renewal_date) : '-' }}</p>
              </div>
            </div>

            <div>
              <h3 class="font-semibold mb-3 flex items-center gap-2">
                <UIcon name="i-lucide-monitor-play" class="w-5 h-5 text-indigo-500" />
                Campanhas Ativas
              </h3>
              <div v-if="selectedClient.campaigns?.length" class="space-y-2">
                <div
                  v-for="camp in selectedClient.campaigns"
                  :key="camp.id"
                  class="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <p class="font-medium">{{ camp.name }}</p>
                  <div class="flex items-center justify-between mt-1">
                    <p class="text-sm text-gray-500">{{ camp.ad_type || 'Mídia' }} · {{ camp.frequency || 'Livre' }}</p>
                    <UBadge :color="camp.status === 'active' ? 'success' : 'neutral'">{{ camp.status }}</UBadge>
                  </div>
                </div>
              </div>
              <p v-else class="text-gray-500 text-sm">Este cliente não possui campanhas na rede.</p>
            </div>

            <div>
              <h3 class="font-semibold mb-3 flex items-center gap-2">
                <UIcon name="i-lucide-file-text" class="w-5 h-5 text-gray-500" />
                Últimas Faturas
              </h3>
              <div v-if="selectedClient.invoices?.length" class="space-y-2">
                <div
                  v-for="inv in selectedClient.invoices.slice(0, 5)"
                  :key="inv.id"
                  class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div>
                    <p class="font-medium">R$ {{ inv.amount?.toFixed(2) }}</p>
                    <p class="text-sm text-gray-500">Vencimento: {{ formatDate(inv.due_date) }}</p>
                  </div>
                  <UBadge :color="getInvoiceStatusColor(inv.status)">{{ getInvoiceStatusLabel(inv.status) }}</UBadge>
                </div>
              </div>
              <p v-else class="text-gray-500 text-sm">Nenhuma fatura registrada.</p>
            </div>
            
            <div class="flex justify-end pt-2">
               <UButton variant="soft" @click="isDetailOpen = false">Fechar</UButton>
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="isDeleteOpen">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4">Confirmar Exclusão</h3>
          <p class="text-gray-600 dark:text-gray-300">
            Tem certeza que deseja excluir o anunciante <strong>{{ clientToDelete?.name }}</strong>?
            Todas as campanhas vinculadas também serão excluídas.
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

definePageMeta({ middleware: 'auth' })

const toast = useToast()

const schema = z.object({
  name: z.string().min(1, 'Nome Principal é obrigatório'),
  email: z.string().optional().or(z.literal('')),
  phone: z.string().optional(),
  document: z.string().optional(),
  address: z.string().optional(),
  contactName: z.string().optional(),
  segment: z.string().optional(),
  leadSource: z.string().optional(),
  planType: z.string().optional(),
  monthlyFee: z.coerce.number().optional().default(0),
  startDate: z.string().optional(),
  renewalDate: z.string().optional(),
  status: z.string().optional().default('active'),
  notes: z.string().optional(),
  graceDays: z.coerce.number().optional().default(30),
})

type FormState = z.infer<typeof schema>

const search = ref('')
const filterStatus = ref('all')
const isModalOpen = ref(false)
const isDetailOpen = ref(false)
const isDeleteOpen = ref(false)
const isSubmitting = ref(false)
const isSyncing = ref(false)
const isDeleting = ref(false)
const editingClient = ref<any>(null)
const selectedClient = ref<any>(null)
const clientToDelete = ref<any>(null)

const formState = reactive<FormState>({
  name: '',
  email: '',
  phone: '',
  document: '',
  address: '',
  contactName: '',
  segment: '',
  leadSource: '',
  planType: '',
  monthlyFee: 0,
  startDate: '',
  renewalDate: '',
  status: 'active',
  notes: '',
  graceDays: 30,
})

const { data: clients, refresh: refreshClients } = await useFetch('/api/clients')

const statusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Ativo', value: 'active' },
  { label: 'Pausado', value: 'paused' },
  { label: 'Cancelado', value: 'cancelled' },
]

const getStatusColor = (status: string) => {
  return status === 'active' ? 'success' : status === 'paused' ? 'warning' : 'error'
}

const getStatusLabel = (status: string) => {
  return statusOptions.find(o => o.value === status)?.label || status
}

const getInvoiceStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'warning',
    paid: 'success',
    overdue: 'error',
    cancelled: 'neutral',
  }
  return colors[status] || 'neutral'
}

const getInvoiceStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    paid: 'Pago',
    overdue: 'Atrasado',
    cancelled: 'Cancelado',
  }
  return labels[status] || status
}


const columns = [
  { accessorKey: 'name', header: 'Anunciante' },
  { accessorKey: 'contact_name', header: 'Contato', cell: ({ row }: any) => row.original.contact_name || '-' },
  { accessorKey: 'segment', header: 'Segmento', cell: ({ row }: any) => row.original.segment || '-' },
  { accessorKey: 'email', header: 'Email', cell: ({ row }: any) => row.original.email || '-' },
  { accessorKey: 'phone', header: 'Telefone', cell: ({ row }: any) => row.original.phone || '-' },
  { accessorKey: 'actions' },
]

const filteredClients = computed(() => {
  if (!clients.value) return []
  let result = clients.value

  if (filterStatus.value !== 'all') {
    result = result.filter((c: any) => c.status === filterStatus.value)
  }

  if (search.value) {
    const s = search.value.toLowerCase()
    result = result.filter((c: any) => c.name.toLowerCase().includes(s) || c.segment?.toLowerCase().includes(s))
  }
  
  return result
})

const formatDate = (date: string) => {
  if (!date) return ''
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(date))
}

const openModal = (client?: any) => {
  if (client) {
    editingClient.value = client
    formState.name = client.name
    formState.email = client.email || ''
    formState.phone = client.phone || ''
    formState.document = client.document || ''
    formState.address = client.address || ''
    formState.contactName = client.contact_name || ''
    formState.segment = client.segment || ''
    formState.leadSource = client.lead_source || ''
    formState.planType = client.plan_type || ''
    formState.monthlyFee = client.monthly_fee || 0
    formState.startDate = client.start_date || ''
    formState.renewalDate = client.renewal_date || ''
    formState.status = client.status || 'active'
    formState.notes = client.notes || ''
    formState.graceDays = client.grace_days || 30
  } else {
    editingClient.value = null
    formState.name = ''
    formState.email = ''
    formState.phone = ''
    formState.document = ''
    formState.address = ''
    formState.contactName = ''
    formState.segment = ''
    formState.leadSource = ''
    formState.planType = ''
    formState.monthlyFee = 0
    formState.startDate = ''
    formState.renewalDate = ''
    formState.status = 'active'
    formState.notes = ''
    formState.graceDays = 30
  }
  isModalOpen.value = true
}

const viewClient = async (client: any) => {
  const { data } = await useFetch(`/api/clients/${client.id}`)
  selectedClient.value = data.value
  isDetailOpen.value = true
}

const confirmDelete = (client: any) => {
  clientToDelete.value = client
  isDeleteOpen.value = true
}

const syncFromLoopin = async () => {
  isSyncing.value = true
  try {
    await $fetch('https://sxsmirhqbslmvyesikgg.supabase.co/functions/v1/sync-advertisers', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4c21pcmhxYnNsbXZ5ZXNpa2dnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg2MzA5NiwiZXhwIjoyMDc5NDM5MDk2fQ.nF46cCyaQ-gGeZRExtXVk7YRwBLkxKg8uSmQsxLi1_Q',
        'Content-Type': 'application/json'
      }
    })
    toast.add({ title: 'Sincronizado!', color: 'success' })
    refreshClients()
  } catch (e: any) {
    toast.add({ title: 'Erro ao sincronizar', color: 'error' })
  } finally {
    isSyncing.value = false
  }
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    if (editingClient.value) {
      await $fetch(`/api/clients/${editingClient.value.id}`, {
        method: 'PUT',
        body: formState,
      })
      toast.add({ title: 'Anunciante atualizado!', color: 'success' })
    } else {
      await $fetch('/api/clients', {
        method: 'POST',
        body: formState,
      })
      toast.add({ title: 'Anunciante cadastrado!', color: 'success' })
    }
    isModalOpen.value = false
    refreshClients()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao sincronizar', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async () => {
  isDeleting.value = true
  try {
    await $fetch(`/api/clients/${clientToDelete.value.id}`, {
      method: 'DELETE',
    })
    toast.add({ title: 'Anunciante excluído!', color: 'success' })
    isDeleteOpen.value = false
    refreshClients()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao excluir', color: 'error' })
  } finally {
    isDeleting.value = false
  }
}
</script>
