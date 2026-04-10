<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Faturas</h1>
        <p class="text-gray-500 dark:text-gray-400">Gerencie as faturas dos clientes</p>
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
        placeholder="Buscar fatura..."
        icon="i-lucide-search"
        class="max-w-xs"
      />
    </div>

    <UCard class="bg-white dark:bg-gray-900">
      <UTable :data="filteredInvoices" :columns="columns" class="w-full">
        <template #actions="{ row }">
          <div class="flex items-center gap-2">
            <UButton
              v-if="row.status === 'pending'"
              variant="ghost"
              color="success"
              size="sm"
              icon="i-lucide-check"
              @click="markAsPaid(row)"
            />
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

    <UModal v-model:open="isModalOpen" :title="editingInvoice ? 'Editar Fatura' : 'Nova Fatura'">
      <UForm :state="formState" :schema="schema" @submit="handleSubmit" class="space-y-4">
        <UFormField label="Cliente" name="clientId">
          <USelect
            v-model="formState.clientId"
            :items="clientOptions"
            placeholder="Selecione o cliente"
            @change="onClientChange"
          />
        </UFormField>

        <UFormField label="Estabelecimento" name="establishmentId">
          <USelect
            v-model="formState.establishmentId"
            :items="establishmentOptions"
            placeholder="Selecione o estabelecimento"
            :disabled="!formState.clientId"
          />
        </UFormField>

        <UFormField label="Valor (R$)" name="amount">
          <UInput
            v-model.number="formState.amount"
            type="number"
            step="0.01"
            placeholder="0.00"
          />
        </UFormField>

        <UFormField label="Data de Vencimento" name="dueDate">
          <UInput
            v-model="formState.dueDate"
            type="date"
          />
        </UFormField>

        <UFormField label="Status" name="status">
          <USelect
            v-model="formState.status"
            :items="statusOptions"
          />
        </UFormField>

        <UFormField label="Observações" name="notes">
          <UTextarea
            v-model="formState.notes"
            placeholder="Observações adicionais..."
            :rows="2"
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
        Tem certeza que deseja excluir esta fatura?
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

definePageMeta({
  middleware: 'auth',
})

const toast = useToast()

const schema = z.object({
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  establishmentId: z.string().optional(),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled', 'barter']).default('pending'),
  notes: z.string().optional(),
})

type FormState = z.infer<typeof schema>

const search = ref('')
const filterStatus = ref('')
const isModalOpen = ref(false)
const isDeleteOpen = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const editingInvoice = ref<any>(null)
const invoiceToDelete = ref<any>(null)

const formState = reactive<FormState>({
  clientId: '',
  establishmentId: '',
  amount: 0,
  dueDate: '',
  status: 'pending',
  notes: '',
})

const { data: invoices, refresh: refreshInvoices } = await useFetch('/api/invoices')
const { data: clients } = await useFetch('/api/clients')
const { data: establishments } = await useFetch('/api/establishments')

const statusOptions = [
  { label: 'Todos', value: '' },
  { label: 'Pendente', value: 'pending' },
  { label: 'Paga', value: 'paid' },
  { label: 'Vencida', value: 'overdue' },
  { label: 'Cancelada', value: 'cancelled' },
  { label: 'Barter', value: 'barter' },
]

const clientOptions = computed(() => {
  if (!clients.value) return []
  return clients.value.map((c: any) => ({
    label: c.name,
    value: c.id,
  }))
})

const establishmentOptions = computed(() => {
  if (!establishments.value || !formState.clientId) return []
  return establishments.value
    .filter((e: any) => e.client_id === formState.clientId)
    .map((e: any) => ({
      label: e.name,
      value: e.id,
    }))
})

const columns = [
  { accessorKey: 'clientName', header: 'Cliente' },
  { accessorKey: 'establishmentName', header: 'Estabelecimento', cell: (row: any) => row.establishmentName || '-' },
  { accessorKey: 'amount', header: 'Valor', cell: (row: any) => `R$ ${(row.amount || 0).toFixed(2)}` },
  { accessorKey: 'due_date', header: 'Vencimento', cell: (row: any) => formatDate(row.due_date) },
  { accessorKey: 'status', header: 'Status', cell: (row: any) => {
    const colors: Record<string, any> = {
      pending: 'warning',
      paid: 'success',
      overdue: 'error',
      cancelled: 'neutral',
      barter: 'info',
    }
    const labels: Record<string, string> = {
      pending: 'Pendente',
      paid: 'Paga',
      overdue: 'Vencida',
      cancelled: 'Cancelada',
      barter: 'Barter',
    }
    return h(UBadge, { color: colors[row.status] || 'neutral' }, () => labels[row.status] || row.status)
  }},
]

const filteredInvoices = computed(() => {
  if (!invoices.value) return []
  let result = invoices.value
  
  if (filterStatus.value) {
    result = result.filter((i: any) => i.status === filterStatus.value)
  }
  
  if (!search.value) return result
  const s = search.value.toLowerCase()
  return result.filter((i: any) =>
    i.clientName?.toLowerCase().includes(s) ||
    i.establishmentName?.toLowerCase().includes(s)
  )
})

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

const onClientChange = () => {
  formState.establishmentId = ''
}

const openModal = (invoice?: any) => {
  if (invoice) {
    editingInvoice.value = invoice
    formState.clientId = invoice.client_id
    formState.establishmentId = invoice.establishment_id || ''
    formState.amount = invoice.amount
    formState.dueDate = invoice.due_date
    formState.status = invoice.status
    formState.notes = invoice.notes || ''
  } else {
    editingInvoice.value = null
    formState.clientId = ''
    formState.establishmentId = ''
    formState.amount = 0
    formState.dueDate = new Date().toISOString().split('T')[0]
    formState.status = 'pending'
    formState.notes = ''
  }
  isModalOpen.value = true
}

const confirmDelete = (invoice: any) => {
  invoiceToDelete.value = invoice
  isDeleteOpen.value = true
}

const markAsPaid = async (invoice: any) => {
  try {
    await $fetch(`/api/invoices/${invoice.id}/pay`, {
      method: 'POST',
    })
    toast.add({ title: 'Fatura marcada como paga!', color: 'success' })
    refreshInvoices()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao marcar', color: 'error' })
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
      toast.add({ title: 'Fatura criada!', color: 'success' })
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
    await $fetch(`/api/invoices/${invoiceToDelete.value.id}`, {
      method: 'DELETE',
    })
    toast.add({ title: 'Fatura excluída!', color: 'success' })
    isDeleteOpen.value = false
    refreshInvoices()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao excluir', color: 'error' })
  } finally {
    isDeleting.value = false
  }
}
</script>
