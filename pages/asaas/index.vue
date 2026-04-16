<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Integração Asaas</h1>
        <p class="text-gray-500 dark:text-gray-400">Gerenciar integração com o gateway de pagamentos</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <UCard class="bg-white dark:bg-gray-900">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Clientes no CRM</p>
            <p class="text-2xl font-bold text-blue-600">{{ crmStats?.total || 0 }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <UIcon name="i-lucide-database" class="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p class="text-sm text-gray-500">
            <span class="text-green-600">{{ crmStats?.withAsaas || 0 }} vinculados</span> ao Asaas
            <br>
            <span class="text-orange-600">{{ crmStats?.withoutAsaas || 0 }} sem vínculo</span>
          </p>
        </div>
      </UCard>

      <UCard class="bg-white dark:bg-gray-900">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <p class="text-lg font-bold" :class="asaasConnected ? 'text-green-600' : 'text-red-600'">
              {{ asaasConnected ? 'Conectado' : 'Não conectado' }}
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl flex items-center justify-center" :class="asaasConnected ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'">
            <UIcon :name="asaasConnected ? 'i-lucide-check-circle' : 'i-lucide-x-circle'" class="w-6 h-6" :class="asaasConnected ? 'text-green-600' : 'text-red-600'" />
          </div>
        </div>
      </UCard>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <UCard class="bg-white dark:bg-gray-900">
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-2">Importar do Asaas</h3>
          <p class="text-gray-600 dark:text-gray-300 text-sm mb-4">
            Importa clientes que já existem no Asaas para o CRM.
            Se o cliente já existir (por email), ele será vinculado.
          </p>
          <UButton 
            color="primary" 
            icon="i-lucide-download"
            :loading="isImporting"
            @click="importarClientes"
          >
            Importar Clientes do Asaas
          </UButton>
        </div>
      </UCard>

      <UCard class="bg-white dark:bg-gray-900">
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-2">Sincronizar para Asaas</h3>
          <p class="text-gray-600 dark:text-gray-300 text-sm mb-4">
            Envia clientes do CRM que ainda não têm vínculo com o Asaas.
            Cria novos clientes no Asaas automaticamente.
          </p>
          <UButton 
            color="success" 
            icon="i-lucide-upload"
            :loading="isSyncing"
            :disabled="crmStats?.withoutAsaas === 0"
            @click="syncClientes"
          >
            Sincronizar {{ crmStats?.withoutAsaas || 0 }} Clientes
          </UButton>
        </div>
      </UCard>
    </div>

    <UCard v-if="syncResult" class="bg-white dark:bg-gray-900">
      <div class="p-6">
        <h3 class="text-lg font-semibold mb-4">Resultado da Operação</h3>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="text-center p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <p class="text-2xl font-bold text-green-600">{{ syncResult.success || 0 }}</p>
            <p class="text-sm text-gray-500">Sucesso</p>
          </div>
          <div class="text-center p-4 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <p class="text-2xl font-bold text-red-600">{{ syncResult.errors || 0 }}</p>
            <p class="text-sm text-gray-500">Erros</p>
          </div>
        </div>
        
        <div v-if="syncResult.details?.syncedClients?.length" class="mb-4">
          <p class="text-sm font-medium mb-2">Sincronizados:</p>
          <div class="flex flex-wrap gap-2">
            <UBadge v-for="name in syncResult.details.syncedClients" :key="name" color="success">
              {{ name }}
            </UBadge>
          </div>
        </div>

        <div v-if="syncResult.details?.skippedClients?.length" class="mb-4">
          <p class="text-sm font-medium mb-2">Ignorados/Já vinculados:</p>
          <div class="flex flex-wrap gap-2">
            <UBadge v-for="name in syncResult.details.skippedClients" :key="name" color="warning">
              {{ name }}
            </UBadge>
          </div>
        </div>
        
        <div v-if="syncResult.details?.errorClients?.length">
          <p class="text-sm font-medium mb-2 text-red-600">Erros:</p>
          <div class="space-y-1">
            <p v-for="err in syncResult.details.errorClients" :key="err" class="text-sm text-red-500">
              {{ err }}
            </p>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const toast = useToast()
const isImporting = ref(false)
const isSyncing = ref(false)
const syncResult = ref<any>(null)
const asaasConnected = ref(false)

const { data: clients, refresh: refreshClients } = await useFetch('/api/clients', { server: false, default: () => [] })

const crmStats = computed(() => {
  const all = clients.value || []
  const withAsaas = all.filter((c: any) => c.asaas_customer_id).length
  const withoutAsaas = all.filter((c: any) => !c.asaas_customer_id).length
  return {
    total: all.length,
    withAsaas,
    withoutAsaas
  }
})

const importarClientes = async () => {
  if (!confirm('Deseja realmente importar os clientes do Asaas?')) return
  
  isImporting.value = true
  syncResult.value = null
  
  try {
    const result = await $fetch('/api/asaas/import-clients', { 
      method: 'POST',
      body: { mode: 'import' }
    })
    syncResult.value = result
    toast.add({ 
      title: result.message, 
      color: 'success' 
    })
    refreshClients()
  } catch (e: any) {
    toast.add({ 
      title: e.data?.message || 'Erro ao importar clientes', 
      color: 'error' 
    })
  } finally {
    isImporting.value = false
  }
}

const syncClientes = async () => {
  if (!confirm('Deseja realmente sincronizar os clientes com o Asaas?')) return
  
  isSyncing.value = true
  syncResult.value = null
  
  try {
    const result = await $fetch('/api/asaas/sync-clients', { method: 'POST' })
    syncResult.value = result
    toast.add({ 
      title: result.message, 
      color: 'success' 
    })
    refreshClients()
  } catch (e: any) {
    toast.add({ 
      title: e.data?.message || 'Erro ao sincronizar clientes', 
      color: 'error' 
    })
  } finally {
    isSyncing.value = false
  }
}
</script>