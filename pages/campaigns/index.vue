<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Campanhas e Mídias</h1>
        <p class="text-gray-500 dark:text-gray-400">Distribua as veiculações nas telas</p>
      </div>
      <UButton color="primary" icon="i-lucide-plus" @click="openModal()">
        Nova Campanha
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
        placeholder="Buscar campanha ou anunciante..."
        icon="i-lucide-search"
        class="max-w-xs"
      />
    </div>

    <UCard class="bg-white dark:bg-gray-900">
      <UTable :data="filteredCampaigns" :columns="columns" class="w-full">
        <template #status-cell="{ row }">
          <UBadge :color="row.original.status === 'active' ? 'success' : 'neutral'">{{ getStatusLabel(row.original.status) }}</UBadge>
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

    <UModal v-model:open="isModalOpen">
      <template #content>
        <div class="p-6 max-h-[90vh] overflow-y-auto">
          <h3 class="text-lg font-semibold mb-4">{{ editingCampaign ? 'Editar Campanha' : 'Criar Nova Campanha' }}</h3>
          <UForm :state="formState" :schema="schema" @submit="handleSubmit" class="space-y-5">
            
            <UFormField label="Anunciante (Quem Paga)" name="clientId">
              <USelect
                v-model="formState.clientId"
                :items="clientOptions"
                placeholder="Selecione o anunciante"
              />
            </UFormField>

            <UFormField label="Nome da Campanha" name="name">
              <UInput v-model="formState.name" placeholder="Ex: Promoção Dia das Mães" />
            </UFormField>

            <UFormField label="Onde Veicular? (Pontos de TV)" name="establishmentIds">
              <USelect
                v-model="formState.establishmentIds"
                :items="establishmentOptions"
                placeholder="Selecione as telas"
                multiple
              />
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Início da Mídia" name="startDate">
                <UInput v-model="formState.startDate" type="date" />
              </UFormField>

              <UFormField label="Fim da Mídia" name="endDate">
                <UInput v-model="formState.endDate" type="date" />
              </UFormField>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Formato" name="adType">
                <USelect v-model="formState.adType" :items="adTypeOptions" />
              </UFormField>

              <UFormField label="Frequência" name="frequency">
                <UInput v-model="formState.frequency" placeholder="Ex: 5 inserções / hr" />
              </UFormField>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Checking URL (Prova)" name="proofOfPlayUrl">
                <UInput v-model="formState.proofOfPlayUrl" placeholder="Link do Google Drive / S3" />
              </UFormField>
              
              <UFormField label="Status" name="status">
                <USelect v-model="formState.status" :items="statusOptions.filter(o => o.value !== 'all')" />
              </UFormField>
            </div>

            <div class="flex justify-end gap-3 pt-4">
              <UButton variant="soft" @click="isModalOpen = false">Cancelar</UButton>
              <UButton type="submit" color="primary" :loading="isSubmitting">Distribuir Campanha</UButton>
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
            Deseja remover <strong>{{ campaignToDelete?.name }}</strong> e descadastrar seus conteúdos de todas as telas vinculadas?
          </p>
          <div class="flex justify-end gap-3 mt-6">
            <UButton variant="soft" @click="isDeleteOpen = false">Cancelar</UButton>
            <UButton color="error" :loading="isDeleting" @click="handleDelete">Excluir e Remover Mídia</UButton>
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
  name: z.string().min(1, 'Nome é obrigatório'),
  establishmentIds: z.array(z.string()).min(1, 'Selecione pelo menos um ponto de TV'),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().optional(),
  adType: z.string().optional(),
  frequency: z.string().optional(),
  proofOfPlayUrl: z.string().optional(),
  status: z.string().default('active'),
})

type FormState = z.infer<typeof schema>

const search = ref('')
const filterStatus = ref('all')
const isModalOpen = ref(false)
const isDeleteOpen = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const editingCampaign = ref<any>(null)
const campaignToDelete = ref<any>(null)

const formState = reactive<FormState>({
  clientId: '',
  name: '',
  establishmentIds: [],
  startDate: '',
  endDate: '',
  adType: 'Video',
  frequency: '',
  proofOfPlayUrl: '',
  status: 'active',
})

const { data: campaigns, refresh: refreshCampaigns } = await useFetch('/api/campaigns')
const { data: clients } = await useFetch('/api/clients')
const { data: establishments } = await useFetch('/api/establishments')

const statusOptions = [
  { label: 'Todas', value: 'all' },
  { label: 'Rodando', value: 'active' },
  { label: 'Expirada', value: 'expired' },
]

const adTypeOptions = [
  { label: 'Vídeo MP4', value: 'Video' },
  { label: 'Imagem Estática', value: 'Imagem' },
  { label: 'HTML Dinâmico', value: 'HTML' },
]

const clientOptions = computed(() => {
  if (!clients.value) return []
  return clients.value.map((c: any) => ({
    label: c.name,
    value: c.id,
  }))
})

const establishmentOptions = computed(() => {
  if (!establishments.value) return []
  return establishments.value.map((e: any) => ({
    label: e.name,
    value: e.id,
  }))
})

const getStatusLabel = (status: string) => {
  return statusOptions.find(o => o.value === status)?.label || status
}

const columns = [
  { accessorKey: 'name', header: 'Campanha' },
  { accessorKey: 'clientName', header: 'Anunciante' },
  { accessorKey: 'establishmentsRendered', header: 'Telas Veiculadas', cell: ({ row }: any) => row.original.establishmentsRendered },
  { accessorKey: 'ad_type', header: 'Formato', cell: ({ row }: any) => row.original.ad_type || '-' },
  { accessorKey: 'end_date', header: 'Fim', cell: ({ row }: any) => formatDate(row.original.end_date) },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'actions' },
]

const filteredCampaigns = computed(() => {
  if (!campaigns.value) return []
  let result = campaigns.value
  
  if (filterStatus.value !== 'all') {
    result = result.filter((c: any) => c.status === filterStatus.value)
  }
  
  if (search.value) {
    const s = search.value.toLowerCase()
    result = result.filter((c: any) => 
      c.name.toLowerCase().includes(s) || 
      c.clientName?.toLowerCase().includes(s) ||
      c.establishmentsRendered?.toLowerCase().includes(s)
    )
  }
  return result
})

const formatDate = (date: string) => {
  if (!date) return '-'
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(date))
}

const openModal = (camp?: any) => {
  if (camp) {
    editingCampaign.value = camp
    formState.clientId = camp.client_id
    formState.name = camp.name
    formState.establishmentIds = camp.establishmentIds || []
    formState.startDate = camp.start_date
    formState.endDate = camp.end_date || ''
    formState.adType = camp.ad_type || 'Video'
    formState.frequency = camp.frequency || ''
    formState.proofOfPlayUrl = camp.proof_of_play_url || ''
    formState.status = camp.status
  } else {
    editingCampaign.value = null
    formState.clientId = ''
    formState.name = ''
    formState.establishmentIds = []
    formState.startDate = new Date().toISOString().split('T')[0]
    formState.endDate = ''
    formState.adType = 'Video'
    formState.frequency = ''
    formState.proofOfPlayUrl = ''
    formState.status = 'active'
  }
  isModalOpen.value = true
}

const confirmDelete = (camp: any) => {
  campaignToDelete.value = camp
  isDeleteOpen.value = true
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    if (editingCampaign.value) {
      await $fetch(`/api/campaigns/${editingCampaign.value.id}`, {
        method: 'PUT',
        body: formState,
      })
      toast.add({ title: 'Campanha atualizada!', color: 'success' })
    } else {
      await $fetch('/api/campaigns', {
        method: 'POST',
        body: formState,
      })
      toast.add({ title: 'Distribuição Mídia concluída!', color: 'success' })
    }
    isModalOpen.value = false
    refreshCampaigns()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao sincronizar', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async () => {
  isDeleting.value = true
  try {
    await $fetch(`/api/campaigns/${campaignToDelete.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'Mídia finalizada!', color: 'success' })
    isDeleteOpen.value = false
    refreshCampaigns()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro', color: 'error' })
  } finally {
    isDeleting.value = false
  }
}
</script>
