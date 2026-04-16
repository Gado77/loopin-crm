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
            <p class="text-sm text-gray-500 dark:text-gray-400">Clientes no Asaas</p>
            <p class="text-2xl font-bold text-blue-600">{{ asaasStats?.totalAsaasClients || 0 }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <UIcon name="i-lucide-users" class="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </UCard>

      <UCard class="bg-white dark:bg-gray-900">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Clientes no CRM</p>
            <p class="text-2xl font-bold text-green-600">{{ asaasStats?.totalCrmClients || 0 }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <UIcon name="i-lucide-database" class="w-6 h-6 text-green-600" />
          </div>
        </div>
      </UCard>
    </div>

    <UCard class="bg-white dark:bg-gray-900 mb-6">
      <div class="p-6">
        <h3 class="text-lg font-semibold mb-4">Importar Clientes do Asaas</h3>
        <p class="text-gray-600 dark:text-gray-300 mb-4">
          Sincroniza todos os clientes que já existem no Asaas para o Loopin CRM.
          Clientes já existentes (por email) serão ignorados.
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

    <UCard v-if="importResult" class="bg-white dark:bg-gray-900">
      <div class="p-6">
        <h3 class="text-lg font-semibold mb-4">Resultado da Importação</h3>
        <div class="grid grid-cols-3 gap-4 mb-4">
          <div class="text-center p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <p class="text-2xl font-bold text-green-600">{{ importResult.imported }}</p>
            <p class="text-sm text-gray-500">Importados</p>
          </div>
          <div class="text-center p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <p class="text-2xl font-bold text-yellow-600">{{ importResult.skipped }}</p>
            <p class="text-sm text-gray-500">Ignorados</p>
          </div>
          <div class="text-center p-4 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <p class="text-2xl font-bold text-red-600">{{ importResult.errors }}</p>
            <p class="text-sm text-gray-500">Erros</p>
          </div>
        </div>
        
        <div v-if="importResult.details?.importedClients?.length" class="mb-4">
          <p class="text-sm font-medium mb-2">Importados:</p>
          <div class="flex flex-wrap gap-2">
            <UBadge v-for="name in importResult.details.importedClients" :key="name" color="success">
              {{ name }}
            </UBadge>
          </div>
        </div>
        
        <div v-if="importResult.details?.skippedClients?.length" class="mb-4">
          <p class="text-sm font-medium mb-2">Ignorados (já existem):</p>
          <div class="flex flex-wrap gap-2">
            <UBadge v-for="name in importResult.details.skippedClients" :key="name" color="warning">
              {{ name }}
            </UBadge>
          </div>
        </div>
        
        <div v-if="importResult.details?.errorClients?.length">
          <p class="text-sm font-medium mb-2 text-red-600">Erros:</p>
          <div class="space-y-1">
            <p v-for="err in importResult.details.errorClients" :key="err" class="text-sm text-red-500">
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
const importResult = ref<any>(null)

const { data: clients } = await useFetch('/api/clients', { server: false, default: () => [] })

const asaasStats = computed(() => {
  return {
    totalCrmClients: clients.value?.length || 0,
    totalAsaasClients: 0
  }
})

const importarClientes = async () => {
  if (!confirm('Deseja realmente importar os clientes do Asaas?')) return
  
  isImporting.value = true
  importResult.value = null
  
  try {
    const result = await $fetch('/api/asaas/import-clients', { method: 'POST' })
    importResult.value = result
    toast.add({ 
      title: result.message, 
      color: 'success' 
    })
  } catch (e: any) {
    toast.add({ 
      title: e.data?.message || 'Erro ao importar clientes', 
      color: 'error' 
    })
  } finally {
    isImporting.value = false
  }
}
</script>