<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Estabelecimentos</h1>
        <p class="text-gray-500 dark:text-gray-400">Gerencie os estabelecimentos dos clientes</p>
      </div>
      <UButton color="primary" icon="i-lucide-plus" @click="openModal()">
        Novo Estabelecimento
      </UButton>
    </div>

    <UCard class="bg-white dark:bg-gray-900">
      <div class="flex items-center gap-4 mb-4">
        <UInput
          v-model="search"
          placeholder="Buscar estabelecimento..."
          icon="i-lucide-search"
          class="max-w-xs"
        />
      </div>

      <UTable :data="filteredEstablishments" :columns="columns" class="w-full">
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

    <UModal v-model:open="isModalOpen" :title="editingEstablishment ? 'Editar Estabelecimento' : 'Novo Estabelecimento'">
      <UForm :state="formState" :schema="schema" @submit="handleSubmit" class="space-y-4">
        <UFormField label="Cliente" name="clientId">
          <USelect
            v-model="formState.clientId"
            :items="clientOptions"
            placeholder="Selecione o cliente"
          />
        </UFormField>

        <UFormField label="Nome" name="name">
          <UInput v-model="formState.name" placeholder="Nome do estabelecimento" />
        </UFormField>

        <UFormField label="Endereço" name="address">
          <UInput v-model="formState.address" placeholder="Endereço completo" />
        </UFormField>

        <UFormField label="Valor Mensal (R$)" name="monthlyFee">
          <UInput
            v-model.number="formState.monthlyFee"
            type="number"
            step="0.01"
            placeholder="0.00"
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
        Tem certeza que deseja excluir o estabelecimento <strong>{{ establishmentToDelete?.name }}</strong>?
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
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório'),
  address: z.string().optional(),
  monthlyFee: z.number().min(0).default(0),
})

type FormState = z.infer<typeof schema>

const search = ref('')
const isModalOpen = ref(false)
const isDeleteOpen = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const editingEstablishment = ref<any>(null)
const establishmentToDelete = ref<any>(null)

const formState = reactive<FormState>({
  clientId: '',
  name: '',
  address: '',
  monthlyFee: 0,
})

const { data: establishments, refresh: refreshEstablishments } = await useFetch('/api/establishments')
const { data: clients } = await useFetch('/api/clients')

const clientOptions = computed(() => {
  if (!clients.value) return []
  return clients.value.map((c: any) => ({
    label: c.name,
    value: c.id,
  }))
})

const columns = [
  { accessorKey: 'name', header: 'Nome' },
  { accessorKey: 'clientName', header: 'Cliente' },
  { accessorKey: 'address', header: 'Endereço', cell: (row: any) => row.address || '-' },
  { accessorKey: 'monthly_fee', header: 'Valor Mensal', cell: (row: any) => `R$ ${(row.monthly_fee || 0).toFixed(2)}` },
]

const filteredEstablishments = computed(() => {
  if (!establishments.value) return []
  if (!search.value) return establishments.value
  const s = search.value.toLowerCase()
  return establishments.value.filter((e: any) =>
    e.name.toLowerCase().includes(s) ||
    e.clientName?.toLowerCase().includes(s)
  )
})

const openModal = (establishment?: any) => {
  if (establishment) {
    editingEstablishment.value = establishment
    formState.clientId = establishment.client_id
    formState.name = establishment.name
    formState.address = establishment.address || ''
    formState.monthlyFee = establishment.monthly_fee || 0
  } else {
    editingEstablishment.value = null
    formState.clientId = ''
    formState.name = ''
    formState.address = ''
    formState.monthlyFee = 0
  }
  isModalOpen.value = true
}

const confirmDelete = (establishment: any) => {
  establishmentToDelete.value = establishment
  isDeleteOpen.value = true
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    if (editingEstablishment.value) {
      await $fetch(`/api/establishments/${editingEstablishment.value.id}`, {
        method: 'PUT',
        body: formState,
      })
      toast.add({ title: 'Estabelecimento atualizado!', color: 'success' })
    } else {
      await $fetch('/api/establishments', {
        method: 'POST',
        body: formState,
      })
      toast.add({ title: 'Estabelecimento criado!', color: 'success' })
    }
    isModalOpen.value = false
    refreshEstablishments()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao salvar', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async () => {
  isDeleting.value = true
  try {
    await $fetch(`/api/establishments/${establishmentToDelete.value.id}`, {
      method: 'DELETE',
    })
    toast.add({ title: 'Estabelecimento excluído!', color: 'success' })
    isDeleteOpen.value = false
    refreshEstablishments()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao excluir', color: 'error' })
  } finally {
    isDeleting.value = false
  }
}
</script>
