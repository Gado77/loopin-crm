<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Estabelecimentos (Pontos)</h1>
        <p class="text-gray-500 dark:text-gray-400">Gerencie os locais onde suas telas estão instaladas</p>
      </div>
      <UButton color="primary" icon="i-lucide-plus" @click="openModal()">
        Novo Ponto de TV
      </UButton>
    </div>

    <UCard class="bg-white dark:bg-gray-900">
      <div class="flex items-center gap-4 mb-4">
        <UInput
          v-model="search"
          placeholder="Buscar ponto..."
          icon="i-lucide-search"
          class="max-w-xs"
        />
        <USelect
          v-model="filterStatus"
          :items="statusOptions"
          placeholder="Status"
        />
      </div>

      <UTable :data="filteredEstablishments" :columns="columns" class="w-full">
        <template #status-data="{ row }">
          <UBadge :color="getStatusColor(row.status)">{{ getStatusLabel(row.status) }}</UBadge>
        </template>
        <template #actions-data="{ row }">
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

    <UModal v-model:open="isModalOpen">
      <template #content>
        <div class="p-6 max-h-[90vh] overflow-y-auto">
          <h3 class="text-lg font-semibold mb-4">{{ editingEstablishment ? 'Editar Ponto' : 'Novo Ponto de TV' }}</h3>
          <UForm :state="formState" :schema="schema" @submit="handleSubmit" class="space-y-4">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField label="Nome do Local" name="name">
                <UInput v-model="formState.name" placeholder="Ex: Padaria Central" />
              </UFormField>

              <UFormField label="Responsável" name="responsibleName">
                <UInput v-model="formState.responsibleName" placeholder="Nome do gerente/dono" />
              </UFormField>
            </div>

            <UFormField label="Endereço Completo" name="address">
              <UInput v-model="formState.address" placeholder="Rua, Número, Bairro" />
            </UFormField>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField label="Qtd. de Telas" name="screensCount">
                <UInput v-model.number="formState.screensCount" type="number" min="1" />
              </UFormField>

              <UFormField label="Fluxo Estimado" name="estimatedFlow">
                <USelect v-model="formState.estimatedFlow" :items="flowOptions" />
              </UFormField>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField label="Perfil de Público" name="audienceType">
                <UInput v-model="formState.audienceType" placeholder="Ex: Jovem, Executivo, Família" />
              </UFormField>

              <UFormField label="Custo do Ponto (R$)" name="locationCost">
                <UInput
                  v-model.number="formState.locationCost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
              </UFormField>
            </div>

            <UFormField label="Status" name="status">
              <USelect v-model="formState.status" :items="statusOptions.filter(o => o.value !== 'all')" />
            </UFormField>

            <div class="flex justify-end gap-3 pt-4">
              <UButton variant="soft" @click="isModalOpen = false">Cancelar</UButton>
              <UButton type="submit" color="primary" :loading="isSubmitting">Salvar Ponto</UButton>
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
            Tem certeza que deseja excluir o ponto <strong>{{ establishmentToDelete?.name }}</strong>?
            Esta ação não pode ser desfeita.
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
  name: z.string().min(1, 'Nome é obrigatório'),
  responsibleName: z.string().optional(),
  address: z.string().optional(),
  screensCount: z.number().min(1).default(1),
  estimatedFlow: z.string().optional(),
  audienceType: z.string().optional(),
  locationCost: z.number().min(0).default(0),
  status: z.string().default('active'),
})

type FormState = z.infer<typeof schema>

const search = ref('')
const filterStatus = ref('all')
const isModalOpen = ref(false)
const isDeleteOpen = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const editingEstablishment = ref<any>(null)
const establishmentToDelete = ref<any>(null)

const formState = reactive<FormState>({
  name: '',
  responsibleName: '',
  address: '',
  screensCount: 1,
  estimatedFlow: 'medium',
  audienceType: '',
  locationCost: 0,
  status: 'active',
})

const { data: establishments, refresh: refreshEstablishments } = await useFetch('/api/establishments')

const statusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Ativo', value: 'active' },
  { label: 'Em Negociação', value: 'negotiation' },
  { label: 'Inativo', value: 'inactive' },
]

const flowOptions = [
  { label: 'Alto', value: 'high' },
  { label: 'Médio', value: 'medium' },
  { label: 'Baixo', value: 'low' },
]

const getStatusColor = (status: string) => {
  return status === 'active' ? 'success' : status === 'negotiation' ? 'warning' : 'neutral'
}

const getStatusLabel = (status: string) => {
  return statusOptions.find(o => o.value === status)?.label || status
}

const columns = [
  { accessorKey: 'name', header: 'Local' },
  { accessorKey: 'address', header: 'Endereço', cell: (row: any) => row.address || '-' },
  { accessorKey: 'screens_count', header: 'Telas', cell: (row: any) => `${row.screens_count || 1}x` },
  { accessorKey: 'location_cost', header: 'Custo do Ponto', cell: (row: any) => `R$ ${(row.location_cost || 0).toFixed(2)}` },
  { accessorKey: 'status', header: 'Status' },
]

const filteredEstablishments = computed(() => {
  if (!establishments.value) return []
  let result = establishments.value

  if (filterStatus.value !== 'all') {
    result = result.filter((e: any) => e.status === filterStatus.value)
  }

  if (search.value) {
    const s = search.value.toLowerCase()
    result = result.filter((e: any) => e.name.toLowerCase().includes(s))
  }
  
  return result
})

const openModal = (establishment?: any) => {
  if (establishment) {
    editingEstablishment.value = establishment
    formState.name = establishment.name
    formState.responsibleName = establishment.responsible_name || ''
    formState.address = establishment.address || ''
    formState.screensCount = establishment.screens_count || 1
    formState.estimatedFlow = establishment.estimated_flow || 'medium'
    formState.audienceType = establishment.audience_type || ''
    formState.locationCost = establishment.location_cost || 0
    formState.status = establishment.status || 'active'
  } else {
    editingEstablishment.value = null
    formState.name = ''
    formState.responsibleName = ''
    formState.address = ''
    formState.screensCount = 1
    formState.estimatedFlow = 'medium'
    formState.audienceType = ''
    formState.locationCost = 0
    formState.status = 'active'
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
      toast.add({ title: 'Ponto atualizado!', color: 'success' })
    } else {
      await $fetch('/api/establishments', {
        method: 'POST',
        body: formState,
      })
      toast.add({ title: 'Ponto criado com sucesso!', color: 'success' })
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
    toast.add({ title: 'Ponto excluído!', color: 'success' })
    isDeleteOpen.value = false
    refreshEstablishments()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao excluir', color: 'error' })
  } finally {
    isDeleting.value = false
  }
}
</script>
