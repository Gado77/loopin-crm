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
        v-model="filterMonth"
        :items="monthOptions"
        placeholder="Período"
        class="w-44"
      />
      <USelect
        v-model="filterStatus"
        :items="statusOptions"
        placeholder="Status"
        class="w-40"
      />
      <USelect
        v-model="filterType"
        :items="typeOptions"
        placeholder="Tipo"
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
        <template #contract-cell="{ row }">
          <UBadge v-if="row.original.contract_id" variant="soft" color="info">Contrato</UBadge>
          <UBadge v-else variant="soft" color="neutral">Avulsa</UBadge>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex items-center gap-1">
            <UButton
              v-if="row.original.status === 'pending' || row.original.status === 'overdue'"
              variant="ghost"
              color="success"
              size="sm"
              icon="i-lucide-check"
              title="Marcar como Pago"
              @click="markAsPaid(row.original)"
            />
            <UButton
              v-if="row.original.status === 'pending' || row.original.status === 'overdue'"
              variant="ghost"
              color="primary"
              size="sm"
              icon="i-lucide-qr-code"
              title="Cobrar via Pix"
              @click="gerarCobranca(row.original, 'PIX')"
            />
            <UButton
              v-if="row.original.status === 'pending' || row.original.status === 'overdue'"
              variant="ghost"
              color="warning"
              size="sm"
              icon="i-lucide-file-text"
              title="Cobrar via Boleto"
              @click="gerarCobranca(row.original, 'BOLETO')"
            />
            <UButton
              v-if="row.original.status === 'pending' || row.original.status === 'overdue'"
              variant="ghost"
              color="neutral"
              size="sm"
              icon="i-lucide-credit-card"
              title="Cobrar via Cartão"
              @click="gerarCobranca(row.original, 'CREDIT_CARD')"
            />
            <UButton
              v-if="row.original.asaas_payment_id && (row.original.status === 'pending' || row.original.status === 'overdue')"
              variant="ghost"
              color="info"
              size="sm"
              icon="i-lucide-send"
              title="Reenviar Cobrança"
              @click="reenviarCobranca(row.original)"
            />
            <UButton
              v-if="row.original.asaas_payment_id && (row.original.status === 'pending' || row.original.status === 'overdue')"
              variant="ghost"
              color="error"
              size="sm"
              icon="i-lucide-x-circle"
              title="Cancelar Cobrança"
              @click="confirmarCancelar(row.original)"
            />
            <UButton
              v-if="row.original.asaas_payment_id && row.original.status === 'paid'"
              variant="ghost"
              color="warning"
              size="sm"
              icon="i-lucide-rotate-ccw"
              title="Estornar Pagamento"
              @click="confirmarEstorno(row.original)"
            />
            <UButton
              variant="ghost"
              size="sm"
              icon="i-lucide-pencil"
              title="Editar"
              @click="openModal(row.original)"
            />
            <UButton
              variant="ghost"
              color="error"
              size="sm"
              icon="i-lucide-trash-2"
              title="Excluir"
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
              icon="i-lucide-external-link"
              @click="openExternalUrl(cobrancaData.invoiceUrl)"
            >
              Ver no Asaas
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="isCancelOpen">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4 text-red-600">Cancelar Cobrança</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4">
            Tem certeza que deseja cancelar esta cobrança? Esta ação não pode ser desfeita.
          </p>
          <div class="flex justify-end gap-3 mt-6">
            <UButton variant="soft" @click="isCancelOpen = false">Voltar</UButton>
            <UButton color="error" @click="cancelarCobranca">Confirmar Cancelamento</UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="isEstornoOpen">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4 text-orange-500">Estornar Pagamento</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-4">
            Deseja solicitar o estorno do pagamento de
            <strong>R$ {{ invoiceToRefund?.amount?.toFixed(2) }}</strong>
            para <strong>{{ invoiceToRefund?.clientName }}</strong>?
            <br><br>
            O estorno será processado pelo Asaas e pode levar alguns dias úteis.
          </p>
          <div class="flex justify-end gap-3 mt-6">
            <UButton variant="soft" @click="isEstornoOpen = false">Cancelar</UButton>
            <UButton color="warning" @click="estornarCobranca">Confirmar Estorno</UButton>
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
const filterType = ref('all')

// DEVE ficar antes de filterMonth para evitar TDZ em produção (build minificado)
const getCurrentMonthValue = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const filterMonth = ref(getCurrentMonthValue())
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

const { data: invoices, refresh: refreshInvoices } = await useFetch('/api/invoices', {
  server: false,
  default: () => []
})
const { data: clients } = await useFetch('/api/clients', {
  server: false,
  default: () => []
})

const statusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Pendente', value: 'pending' },
  { label: 'Pago', value: 'paid' },
  { label: 'Atrasado', value: 'overdue' },
  { label: 'Cancelado', value: 'cancelled' },
  { label: 'Estornado', value: 'refunded' },
  { label: 'Permuta', value: 'barter' },
]

const typeOptions = [
  { label: 'Todas', value: 'all' },
  { label: 'De Contrato', value: 'contract' },
  { label: 'Avulsas', value: 'standalone' },
]

// getCurrentMonthValue foi movida para antes de filterMonth (linha ~254)
// para evitar Temporal Dead Zone (TDZ) em builds de produção minificados

const monthOptions = computed(() => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  
  const months = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(currentYear, currentMonth - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = i === 0 ? `${monthNames[d.getMonth()]} ${d.getFullYear()} (Atual)` : `${monthNames[d.getMonth()]} ${d.getFullYear()}`
    months.push({ label, value })
  }
  
  return [
    ...months,
    { label: 'Próximo Mês', value: 'next' },
    { label: 'Últimos 3 Meses', value: 'last3' },
    { label: 'Este Ano', value: 'year' },
    { label: 'Todas', value: 'all' },
  ]
})

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
    refunded: 'info',
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
  { accessorKey: 'contract', header: 'Tipo', cell: 'contract-cell' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'actions' },
]

const filteredInvoices = computed(() => {
  if (!invoices.value) return []
  let result = invoices.value
  
  if (filterMonth.value && filterMonth.value !== 'all') {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    
    if (filterMonth.value === 'next') {
      const nextMonth = new Date(currentYear, currentMonth + 1, 1)
      const nextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`
      result = result.filter((i: any) => i.due_date?.startsWith(nextMonthStr))
    } else if (filterMonth.value === 'last3') {
      const threeMonthsAgo = new Date(currentYear, currentMonth - 2, 1)
      result = result.filter((i: any) => {
        const dueDate = new Date(i.due_date)
        return dueDate >= threeMonthsAgo
      })
    } else if (filterMonth.value === 'year') {
      result = result.filter((i: any) => i.due_date?.startsWith(String(currentYear)))
    } else if (filterMonth.value === 'current') {
      const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
      result = result.filter((i: any) => i.due_date?.startsWith(currentMonthStr))
    } else {
      result = result.filter((i: any) => i.due_date?.startsWith(filterMonth.value))
    }
  }
  
  if (filterStatus.value !== 'all') {
    result = result.filter((i: any) => i.status === filterStatus.value)
  }
  
  if (filterType.value === 'contract') {
    result = result.filter((i: any) => i.contract_id)
  } else if (filterType.value === 'standalone') {
    result = result.filter((i: any) => !i.contract_id)
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

const gerarCobranca = async (invoice: any, billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD') => {
  isGerandoCobranca.value = true
  try {
    const result = await $fetch('/api/asaas/create-payment', {
      method: 'POST',
      body: { invoiceId: invoice.id, billingType }
    })

    if (result.success) {
      cobrancaData.value = {
        ...result.payment,
        invoiceId: invoice.id,
        value: invoice.amount,
        alreadyExists: result.alreadyExists
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

const getActionItems = (invoice: any) => {
  const items: any[][] = []
  
  if (!invoice.asaas_payment_id) {
    items.push([
      { label: 'Cobrar via Pix', icon: 'i-lucide-qr-code', onClick: () => gerarCobranca(invoice, 'PIX') },
      { label: 'Cobrar via Boleto', icon: 'i-lucide-file-text', onClick: () => gerarCobranca(invoice, 'BOLETO') },
    ])
  } else {
    items.push([
      { label: 'Reenviar Cobrança', icon: 'i-lucide-send', onClick: () => reenviarCobranca(invoice) },
      { label: 'Cancelar Cobrança', icon: 'i-lucide-x-circle', onClick: () => confirmarCancelar(invoice) },
    ])
  }
  
  return items
}

const reenviarCobranca = async (invoice: any) => {
  if (!invoice.asaas_payment_id) return
  
  try {
    const result = await $fetch('/api/asaas/resend-payment', {
      method: 'POST',
      body: { paymentId: invoice.asaas_payment_id }
    })
    toast.add({ title: result.message || 'Cobrança reenviada!', color: 'success' })
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao reenviar cobrança', color: 'error' })
  }
}

const isCancelOpen = ref(false)
const invoiceToCancel = ref<any>(null)
const isEstornoOpen = ref(false)
const invoiceToRefund = ref<any>(null)

const confirmarCancelar = (invoice: any) => {
  invoiceToCancel.value = invoice
  isCancelOpen.value = true
}

const markAsPaid = async (invoice: any) => {
  const isPermuta = confirm(`Como deseja marcar essa fatura de ${invoice.clientName}?\n[OK] = Paga em Dinheiro\n[Cancelar] = Permuta (Gratuita)`)

  // Se a pessoa confirmar (Ok) = Dinheiro. Se der (Cancerlar) = Permuta.
  // Como confirm() não permite opções personalizadas, é rústico mas efetivo, 
  // porém podemos usar o próprio modal do NuxtUI, mas para rapidez vamos de POST direto.
  const status = isPermuta ? 'paid' : 'barter'
  const method = isPermuta ? 'Dinheiro' : 'Permuta'

  if (!confirm(`Confirmar fatura como ${method}? Isso reativará o cliente na rede DOOH se ele estiver bloqueado.`)) return

  try {
    await $fetch(`/api/invoices/${invoice.id}/mark-paid`, {
      method: 'POST',
      body: { status, paymentMethod: method }
    })
    toast.add({ title: `Fatura arquivada como ${method}!`, color: 'success' })
    refreshInvoices()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao atualizar fatura', color: 'error' })
  }
}

const cancelarCobranca = async () => {
  if (!invoiceToCancel.value?.asaas_payment_id) return

  try {
    await $fetch('/api/asaas/cancel-payment', {
      method: 'POST',
      body: { paymentId: invoiceToCancel.value.asaas_payment_id, invoiceId: invoiceToCancel.value.id }
    })
    toast.add({ title: 'Cobrança cancelada!', color: 'success' })
    isCancelOpen.value = false
    refreshInvoices()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao cancelar cobrança', color: 'error' })
  }
}

const confirmarEstorno = (invoice: any) => {
  invoiceToRefund.value = invoice
  isEstornoOpen.value = true
}

const estornarCobranca = async () => {
  if (!invoiceToRefund.value?.asaas_payment_id) return

  try {
    await $fetch('/api/asaas/refund-payment', {
      method: 'POST',
      body: { paymentId: invoiceToRefund.value.asaas_payment_id, invoiceId: invoiceToRefund.value.id }
    })
    toast.add({ title: 'Estorno solicitado com sucesso!', color: 'success' })
    isEstornoOpen.value = false
    refreshInvoices()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao estornar pagamento', color: 'error' })
  }
}

const copiarPix = (texto: string) => {
  navigator.clipboard.writeText(texto)
}

const openExternalUrl = (url: string) => {
  window.open(url, '_blank')
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
