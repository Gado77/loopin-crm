<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Clientes</h1>
        <p class="text-gray-500 dark:text-gray-400">Gerencie seus clientes</p>
      </div>
      <UButton color="primary" icon="i-lucide-plus" @click="openModal()">
        Novo Cliente
      </UButton>
    </div>

    <UCard class="bg-white dark:bg-gray-900">
      <div class="flex items-center gap-4 mb-4">
        <UInput
          v-model="search"
          placeholder="Buscar cliente..."
          icon="i-lucide-search"
          class="max-w-xs"
        />
      </div>

      <UTable :data="filteredClients" :columns="columns" class="w-full">
        <template #actions="{ row }">
          <div class="flex items-center gap-2">
            <UButton
              variant="ghost"
              color="primary"
              size="sm"
              icon="i-lucide-eye"
              @click="viewClient(row)"
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

    <UModal v-model:open="isModalOpen" :title="editingClient ? 'Editar Cliente' : 'Novo Cliente'">
      <UForm :state="formState" :schema="schema" @submit="handleSubmit" class="space-y-4">
        <UFormField label="Nome" name="name">
          <UInput v-model="formState.name" placeholder="Nome do cliente" />
        </UFormField>

        <UFormField label="Email" name="email">
          <UInput v-model="formState.email" type="email" placeholder="email@exemplo.com" />
        </UFormField>

        <UFormField label="Telefone" name="phone">
          <UInput v-model="formState.phone" placeholder="(11) 99999-9999" />
        </UFormField>

        <UFormField label="Documento" name="document">
          <UInput v-model="formState.document" placeholder="CPF/CNPJ" />
        </UFormField>

        <UFormField label="Endereço" name="address">
          <UInput v-model="formState.address" placeholder="Endereço completo" />
        </UFormField>

        <UFormField label="Dias de tolerância (inadimplência)" name="graceDays">
          <UInput v-model.number="formState.graceDays" type="number" placeholder="30" />
          <template #description>
            Dias após o vencimento para considerar inadimplente
          </template>
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

    <UModal v-model:open="isDetailOpen" title="Detalhes do Cliente">
      <div v-if="selectedClient" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500">Nome</p>
            <p class="font-medium">{{ selectedClient.name }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Email</p>
            <p class="font-medium">{{ selectedClient.email || '-' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Telefone</p>
            <p class="font-medium">{{ selectedClient.phone || '-' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Documento</p>
            <p class="font-medium">{{ selectedClient.document || '-' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Dias de tolerância</p>
            <p class="font-medium">{{ selectedClient.grace_days }} dias</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Endereço</p>
            <p class="font-medium">{{ selectedClient.address || '-' }}</p>
          </div>
        </div>

        <div class="border-t pt-4 mt-4">
          <h3 class="font-semibold mb-3">Estabelecimentos ({{ selectedClient.establishments?.length || 0 }})</h3>
          <div v-if="selectedClient.establishments?.length" class="space-y-2">
            <div
              v-for="est in selectedClient.establishments"
              :key="est.id"
              class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <p class="font-medium">{{ est.name }}</p>
              <p class="text-sm text-gray-500">{{ est.address || 'Sem endereço' }}</p>
              <p class="text-sm text-indigo-600">R$ {{ est.monthly_fee?.toFixed(2) }}/mês</p>
            </div>
          </div>
          <p v-else class="text-gray-500">Nenhum estabelecimento cadastrado</p>
        </div>

        <div class="border-t pt-4 mt-4">
          <h3 class="font-semibold mb-3">Faturas ({{ selectedClient.invoices?.length || 0 }})</h3>
          <div v-if="selectedClient.invoices?.length" class="space-y-2">
            <div
              v-for="inv in selectedClient.invoices.slice(0, 5)"
              :key="inv.id"
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div>
                <p class="font-medium">R$ {{ inv.amount?.toFixed(2) }}</p>
                <p class="text-sm text-gray-500">Venc: {{ formatDate(inv.due_date) }}</p>
              </div>
              <UBadge :color="getStatusColor(inv.status)">{{ inv.status }}</UBadge>
            </div>
          </div>
          <p v-else class="text-gray-500">Nenhuma fatura registrada</p>
        </div>
      </div>
    </UModal>

    <UModal v-model:open="isDeleteOpen" title="Confirmar Exclusão">
      <p class="text-gray-600 dark:text-gray-300">
        Tem certeza que deseja excluir o cliente <strong>{{ clientToDelete?.name }}</strong>?
        Esta ação não pode ser desfeita.
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
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  document: z.string().optional(),
  address: z.string().optional(),
  graceDays: z.number().min(0).default(30),
})

type FormState = z.infer<typeof schema>

const search = ref('')
const isModalOpen = ref(false)
const isDetailOpen = ref(false)
const isDeleteOpen = ref(false)
const isSubmitting = ref(false)
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
  graceDays: 30,
})

const { data: clients, refresh: refreshClients } = await useFetch('/api/clients')

const columns = [
  { accessorKey: 'name', header: 'Nome' },
  { accessorKey: 'email', header: 'Email', cell: (row: any) => row.email || '-' },
  { accessorKey: 'phone', header: 'Telefone', cell: (row: any) => row.phone || '-' },
  { accessorKey: 'grace_days', header: 'Tolerância', cell: (row: any) => `${row.grace_days} dias` },
]

const filteredClients = computed(() => {
  if (!clients.value) return []
  if (!search.value) return clients.value
  const s = search.value.toLowerCase()
  return clients.value.filter((c: any) =>
    c.name.toLowerCase().includes(s) ||
    c.email?.toLowerCase().includes(s)
  )
})

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

const getStatusColor = (status: string) => {
  const colors: Record<string, any> = {
    pending: 'warning',
    paid: 'success',
    overdue: 'error',
    cancelled: 'neutral',
    barter: 'info',
  }
  return colors[status] || 'neutral'
}

const openModal = (client?: any) => {
  if (client) {
    editingClient.value = client
    formState.name = client.name
    formState.email = client.email || ''
    formState.phone = client.phone || ''
    formState.document = client.document || ''
    formState.address = client.address || ''
    formState.graceDays = client.grace_days
  } else {
    editingClient.value = null
    formState.name = ''
    formState.email = ''
    formState.phone = ''
    formState.document = ''
    formState.address = ''
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

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    if (editingClient.value) {
      await $fetch(`/api/clients/${editingClient.value.id}`, {
        method: 'PUT',
        body: formState,
      })
      toast.add({ title: 'Cliente atualizado com sucesso!', color: 'success' })
    } else {
      await $fetch('/api/clients', {
        method: 'POST',
        body: formState,
      })
      toast.add({ title: 'Cliente criado com sucesso!', color: 'success' })
    }
    isModalOpen.value = false
    refreshClients()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao salvar', color: 'error' })
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
    toast.add({ title: 'Cliente excluído com sucesso!', color: 'success' })
    isDeleteOpen.value = false
    refreshClients()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao excluir', color: 'error' })
  } finally {
    isDeleting.value = false
  }
}
</script>
