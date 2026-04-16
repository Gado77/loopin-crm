<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Faturas (A Receber)</h1>
        <p class="text-gray-500 dark:text-gray-400">Controle de recebimentos dos anunciantes</p>
      </div>
      <UButton color="primary" icon="i-lucide-plus" @click="openModal()">
        Nova Fatura
      </UButton>
    </div>

    <div class="flex flex-wrap gap-4 mb-6">
      <USelect
        v-model="filterStatus"
        :items="statusOptions"
        placeholder="Status"
        class="w-40"
      />
      <UInput
        v-model="search"
        placeholder="Buscar anunciante..."
        icon="i-lucide-search"
        class="max-w-xs"
      />
    </div>

    <UCard class="bg-white dark:bg-gray-900">
      <UTable :data="filteredInvoices" :columns="columns" class="w-full">
        <template #status-cell="{ row }">
          <UBadge :color="getStatusColor(row.original.status)">{{ getStatusLabel(row.original.status) }}</UBadge>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex items-center gap-2">
            <UButton
              v-if="row.original.status === 'pending' || row.original.status === 'overdue'"
              variant="ghost"
              color="success"
              size="sm"
              icon="i-lucide-check"
              @click="markAsPaid(row.original)"
            />
            <UDropdown
              v-if="row.original.status === 'pending' || row.original.status === 'overdue'"
              :items="[
                [
                  { label: 'Cobrar via Pix', icon: 'i-lucide-qr-code', onClick: () => gerarCobranca(row.original, 'PIX') },
                  { label: 'Cobrar via Boleto', icon: 'i-lucide-file-text', onClick: () => gerarCobranca(row.original, 'BOLETO') },
                ]
              ]"
            >
              <UButton variant="ghost" color="primary" size="sm" icon="i-lucide-credit-card" />
            </UDropdown>
            <UButton
              v-if="row.original.asaas_payment_id"
              variant="ghost"
              color="info"
              size="sm"
              icon="i-lucide-eye"
              @click="verCobranca(row.original)"
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
          <h3 class="text-lg font-semibold mb-4">{{ editingInvoice ? 'Editar Fatura' : 'Nova Fatura' }}</h3>
          <UForm :state="formState" :schema="schema" @submit="handleSubmit" class="space-y-4">
            
            <UFormField label="Anunciante (Cliente)" name="clientId">
              <USelect
                v-model="formState.clientId"
                :items="clientOptions"
                placeholder="Selecione o anunciante"
              />
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Valor (R$)" name="amount">
                <UInput
                  v-model.number="formState.amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
              </UFormField>

              <UFormField label="Vencimento" name="dueDate">
                <UInput
                  v-model="formState.dueDate"
                  type="date"
                />
              </UFormField>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Status" name="status">
                <USelect v-model="formState.status" :items="statusOptions.filter(o => o.value !== 'all')" />
              </UFormField>
              
              <UFormField label="Forma de Pagamento" name="paymentMethod">
                <USelect v-model="formState.paymentMethod" :items="paymentMethods" placeholder="Ex: Pix" />
              </UFormField>
            </div>

            <UFormField label="Observações Financeiras" name="notes">
              <UTextarea
                v-model="formState.notes"
                placeholder="Histórico ou detalhes de negociação..."
                :rows="2"
              />
            </UFormField>

            <div class="flex justify-end gap-3 pt-4">
              <UButton variant="soft" @click="isModalOpen = false">Cancelar</UButton>
              <UButton type="submit" color="primary" :loading="isSubmitting">Salvar</UButton>
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
            Tem certeza que deseja excluir esta fatura? O registro financeiro será perdido.
          </p>
          <div class="flex justify-end gap-3 mt-6">
            <UButton variant="soft" @click="isDeleteOpen = false">Cancelar</UButton>
            <UButton color="error" :loading="isDeleting" @click="handleDelete">Excluir</UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="isCobrancaOpen">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4">Cobrança Gerada</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4">
            Fatura #{{ cobrancaData.invoiceId?.slice(0, 8) }} - R$ {{ cobrancaData.value?.toFixed(2) }}
          </p>
          
          <div v-if="cobrancaData.billingType === 'PIX' && cobrancaData.pixQrCode" class="text-center">
            <img 
              :src="`data:image/png;base64,${cobrancaData.pixQrCode.encodedImage}`" 
              alt="QR Code Pix"
              class="mx-auto mb-4 w-48 h-48"
            />
            <p class="text-sm text-gray-500 mb-2">Escaneie o QR Code ou use o código abaixo:</p>
            <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono break-all mb-4">
              {{ cobrancaData.pixQrCode.payload }}
            </div>
            <UButton
              variant="soft"
              icon="i-lucide-copy"
              @click="copiarPix(cobrancaData.pixQrCode.payload)"
            >
              Copiar código Pix
            </UButton>
          </div>
          
          <div v-else-if="cobrancaData.billingType === 'BOLETO' && cobrancaData.invoiceUrl" class="text-center">
            <p class="text-gray-600 dark:text-gray-300 mb-4">Boleto gerado com sucesso!</p>
            <a 
              :href="cobrancaData.invoiceUrl" 
              target="_blank"
              class="inline-block"
            >
              <UButton color="primary" icon="i-lucide external-link">
                Abrir Boleto
              </UButton>
            </a>
          </div>
          
          <div v-else class="text-center">
            <p class="text-gray-600 dark:text-gray-300">Cobrança criada. Acesse o painel Asaas para visualizar.</p>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <UButton variant="soft" @click="isCobrancaOpen = false">Fechar</UButton>
            <UButton 
              v-if="cobrancaData.invoiceUrl" 
              color="primary"
              icon="i-lucide external-link"
              @click="window.open(cobrancaData.invoiceUrl, '_blank')"
            >
              Ver no Asaas
            </UButton>
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
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  amount: z.number().min(0.01, 'Valor deve ser superior a zero'),
  dueDate: z.string().min(1, 'Data de vencimento obrigatória'),
  status: z.string().default('pending'),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
})

type FormState = z.infer<typeof schema>

const search = ref('')
const filterStatus = ref('all')
const isModalOpen = ref(false)
const isDeleteOpen = ref(false)
const isCobrancaOpen = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const editingInvoice = ref<any>(null)
const invoiceToDelete = ref<any>(null)
const cobrancaData = ref<any>({})
const isGerandoCobranca = ref(false)

const formState = reactive<FormState>({
  clientId: '',
  amount: 0,
  dueDate: '',
  status: 'pending',
  paymentMethod: '',
  notes: '',
})

const { data: invoices, refresh: refreshInvoices } = await useFetch('/api/invoices')
const { data: clients } = await useFetch('/api/clients')

const statusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Pendente', value: 'pending' },
  { label: 'Pago', value: 'paid' },
  { label: 'Atrasado', value: 'overdue' },
  { label: 'Cancelado', value: 'cancelled' },
  { label: 'Permuta', value: 'barter' },
]

const paymentMethods = [
  { label: 'Pix', value: 'Pix' },
  { label: 'Boleto', value: 'Boleto' },
  { label: 'Cartão de Crédito', value: 'Cartão' },
  { label: 'Dinheiro', value: 'Dinheiro' },
  { label: 'Permuta', value: 'Permuta' },
]

const clientOptions = computed(() => {
  if (!clients.value) return []
  return clients.value.map((c: any) => ({
    label: c.name,
    value: c.id,
  }))
})

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'warning',
    paid: 'success',
    overdue: 'error',
    cancelled: 'neutral',
    barter: 'info',
  }
  return colors[status] || 'neutral'
}

const getStatusLabel = (status: string) => {
  return statusOptions.find(o => o.value === status)?.label || status
}

const columns = [
  { accessorKey: 'clientName', header: 'Anunciante' },
  { accessorKey: 'amount', header: 'Valor (R$)', cell: ({ row }: any) => `R$ ${(row.original.amount || 0).toFixed(2)}` },
  { accessorKey: 'due_date', header: 'Vencimento', cell: ({ row }: any) => formatDate(row.original.due_date) },
  { accessorKey: 'payment_method', header: 'Meio Pgto', cell: ({ row }: any) => row.original.payment_method || '-' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'actions' },
]

const filteredInvoices = computed(() => {
  if (!invoices.value) return []
  let result = invoices.value
  
  if (filterStatus.value !== 'all') {
    result = result.filter((i: any) => i.status === filterStatus.value)
  }
  
  if (search.value) {
    const s = search.value.toLowerCase()
    result = result.filter((i: any) => i.clientName?.toLowerCase().includes(s))
  }
  return result
})

const formatDate = (date: string) => {
  if (!date) return ''
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(date))
}

const openModal = (invoice?: any) => {
  if (invoice) {
    editingInvoice.value = invoice
    formState.clientId = invoice.client_id
    formState.amount = invoice.amount
    formState.dueDate = invoice.due_date
    formState.status = invoice.status
    formState.paymentMethod = invoice.payment_method || ''
    formState.notes = invoice.notes || ''
  } else {
    editingInvoice.value = null
    formState.clientId = ''
    formState.amount = 0
    formState.dueDate = new Date().toISOString().split('T')[0]
    formState.status = 'pending'
    formState.paymentMethod = ''
    formState.notes = ''
  }
  isModalOpen.value = true
}

const confirmDelete = (invoice: any) => {
  invoiceToDelete.value = invoice
  isDeleteOpen.value = true
}

const gerarCobranca = async (invoice: any, billingType: 'PIX' | 'BOLETO') => {
  isGerandoCobranca.value = true
  try {
    const client = (clients.value as any[])?.find(c => c.id === invoice.client_id)
    
    if (!client?.asaas_customer_id) {
      const customerResult = await $fetch('/api/asaas/create-customer', {
        method: 'POST',
        body: { clientId: invoice.client_id }
      })
    }
    
    const result = await $fetch('/api/asaas/create-payment', {
      method: 'POST',
      body: { invoiceId: invoice.id, billingType }
    })
    
    if (result.success) {
      cobrancaData.value = {
        ...result.payment,
        invoiceId: invoice.id,
        value: invoice.amount
      }
      isCobrancaOpen.value = true
      refreshInvoices()
    }
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao gerar cobrança', color: 'error' })
  } finally {
    isGerandoCobranca.value = false
  }
}

const verCobranca = async (invoice: any) => {
  if (!invoice.asaas_payment_id) return
  
  try {
    const result = await $fetch(`/api/asaas/payment-status/${invoice.asaas_payment_id}`)
    if (result.payment) {
      toast.add({ 
        title: `Status: ${result.payment.status}`, 
        color: result.payment.mappedStatus === 'paid' ? 'success' : 'info' 
      })
    }
  } catch (e: any) {
    toast.add({ title: 'Erro ao buscar status', color: 'error' })
  }
}

const copiarPix = (texto: string) => {
  navigator.clipboard.writeText(texto)
}

const markAsPaid = async (invoice: any) => {
  try {
    await $fetch(`/api/invoices/${invoice.id}/pay`, { method: 'POST' })
    toast.add({ title: 'Fatura liquidada!', color: 'success' })
    refreshInvoices()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao processar', color: 'error' })
  }
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    if (editingInvoice.value) {
      await $fetch(`/api/invoices/${editingInvoice.value.id}`, {
        method: 'PUT',
        body: formState,
      })
      toast.add({ title: 'Fatura atualizada!', color: 'success' })
    } else {
      await $fetch('/api/invoices', {
        method: 'POST',
        body: formState,
      })
      toast.add({ title: 'Fatura registrada!', color: 'success' })
    }
    isModalOpen.value = false
    refreshInvoices()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao salvar', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async () => {
  isDeleting.value = true
  try {
    await $fetch(`/api/invoices/${invoiceToDelete.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'Fatura excluída!', color: 'success' })
    isDeleteOpen.value = false
    refreshInvoices()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro', color: 'error' })
  } finally {
    isDeleting.value = false
  }
}
</script>
