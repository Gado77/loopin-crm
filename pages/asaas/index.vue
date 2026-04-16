<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Integração Asaas</h1>
        <p class="text-gray-500 dark:text-gray-400">Gerenciar gateway de pagamentos e cobranças</p>
      </div>
      <UButton variant="soft" icon="i-lucide-refresh-ccw" :loading="isLoading" @click="reload">
        Atualizar
      </UButton>
    </div>

    <!-- Status Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <!-- Conexão Asaas -->
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Status Asaas</p>
            <p
              class="text-lg font-bold"
              :class="status?.asaas?.connected ? 'text-green-600' : 'text-red-600'"
            >
              {{ status?.asaas?.connected ? 'Conectado' : 'Desconectado' }}
            </p>
            <p v-if="status?.asaas?.account" class="text-xs text-gray-400 mt-0.5">
              {{ status.asaas.account }}
            </p>
            <p v-else-if="status?.asaas?.error" class="text-xs text-red-400 mt-0.5">
              {{ status.asaas.error }}
            </p>
          </div>
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center"
            :class="status?.asaas?.connected ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'"
          >
            <UIcon
              :name="status?.asaas?.connected ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
              class="w-6 h-6"
              :class="status?.asaas?.connected ? 'text-green-600' : 'text-red-600'"
            />
          </div>
        </div>
      </UCard>

      <!-- Clientes CRM -->
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Clientes no CRM</p>
            <p class="text-2xl font-bold text-blue-600">{{ status?.clients?.total || 0 }}</p>
            <p class="text-xs text-gray-400 mt-0.5">
              <span class="text-green-600">{{ status?.clients?.withAsaas || 0 }} vinculados</span>
              · <span class="text-orange-500">{{ status?.clients?.withoutAsaas || 0 }} não vinculados</span>
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <UIcon name="i-lucide-users" class="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </UCard>

      <!-- Faturas -->
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Faturas no Asaas</p>
            <p class="text-2xl font-bold text-purple-600">{{ status?.invoices?.withAsaasPayment || 0 }}</p>
            <p class="text-xs text-gray-400 mt-0.5">
              <span class="text-yellow-500">{{ status?.invoices?.pending || 0 }} pendentes</span>
              · <span class="text-red-500">{{ status?.invoices?.overdue || 0 }} atrasadas</span>
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <UIcon name="i-lucide-receipt" class="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Ações -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <!-- Importar do Asaas -->
      <UCard>
        <div>
          <h3 class="text-base font-semibold mb-1 flex items-center gap-2">
            <UIcon name="i-lucide-download" class="w-4 h-4 text-blue-600" />
            Importar do Asaas
          </h3>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-4">
            Importa clientes que já existem no Asaas para o CRM. Se o cliente já existir por email, ele será vinculado automaticamente.
          </p>
          <UButton
            color="primary"
            icon="i-lucide-download"
            :loading="isImporting"
            :disabled="!status?.asaas?.connected"
            @click="importarClientes"
          >
            Importar Clientes do Asaas
          </UButton>
        </div>
      </UCard>

      <!-- Sincronizar para Asaas -->
      <UCard>
        <div>
          <h3 class="text-base font-semibold mb-1 flex items-center gap-2">
            <UIcon name="i-lucide-upload" class="w-4 h-4 text-green-600" />
            Sincronizar para Asaas
          </h3>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-4">
            Envia clientes do CRM que não têm vínculo com o Asaas. Cria novos clientes no Asaas automaticamente.
          </p>
          <UButton
            color="success"
            icon="i-lucide-upload"
            :loading="isSyncing"
            :disabled="!status?.asaas?.connected || (status?.clients?.withoutAsaas === 0)"
            @click="syncClientes"
          >
            Sincronizar {{ status?.clients?.withoutAsaas || 0 }} cliente(s)
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Resultado da última operação -->
    <UCard v-if="syncResult" class="mb-6">
      <div>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold">Resultado da Operação</h3>
          <UButton variant="ghost" size="sm" icon="i-lucide-x" @click="syncResult = null" />
        </div>

        <div class="grid grid-cols-3 gap-4 mb-4">
          <div v-if="syncResult.imported !== undefined" class="text-center p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <p class="text-2xl font-bold text-green-600">{{ syncResult.imported || 0 }}</p>
            <p class="text-xs text-gray-500">Importados</p>
          </div>
          <div v-if="syncResult.synced !== undefined" class="text-center p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <p class="text-2xl font-bold text-green-600">{{ syncResult.synced || 0 }}</p>
            <p class="text-xs text-gray-500">Sincronizados</p>
          </div>
          <div class="text-center p-3 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
            <p class="text-2xl font-bold text-sky-600">{{ syncResult.skipped || 0 }}</p>
            <p class="text-xs text-gray-500">Ignorados</p>
          </div>
          <div class="text-center p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <p class="text-2xl font-bold text-red-600">{{ syncResult.errors || 0 }}</p>
            <p class="text-xs text-gray-500">Erros</p>
          </div>
        </div>

        <div v-if="syncResult.details?.importedClients?.length" class="mb-3">
          <p class="text-xs font-medium mb-1 text-green-600">Importados:</p>
          <div class="flex flex-wrap gap-1">
            <UBadge v-for="name in syncResult.details.importedClients" :key="name" color="success" size="sm">
              {{ name }}
            </UBadge>
          </div>
        </div>

        <div v-if="syncResult.details?.syncedClients?.length" class="mb-3">
          <p class="text-xs font-medium mb-1 text-green-600">Sincronizados:</p>
          <div class="flex flex-wrap gap-1">
            <UBadge v-for="name in syncResult.details.syncedClients" :key="name" color="success" size="sm">
              {{ name }}
            </UBadge>
          </div>
        </div>

        <div v-if="syncResult.details?.skippedClients?.length" class="mb-3">
          <p class="text-xs font-medium mb-1 text-sky-600">Ignorados (já vinculados):</p>
          <div class="flex flex-wrap gap-1">
            <UBadge v-for="name in syncResult.details.skippedClients" :key="name" color="info" size="sm">
              {{ name }}
            </UBadge>
          </div>
        </div>

        <div v-if="syncResult.details?.errorClients?.length">
          <p class="text-xs font-medium mb-1 text-red-600">Erros:</p>
          <div class="space-y-0.5">
            <p v-for="err in syncResult.details.errorClients" :key="err" class="text-xs text-red-500">
              {{ err }}
            </p>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Configuração do Webhook -->
    <UCard>
      <div>
        <h3 class="text-base font-semibold mb-2 flex items-center gap-2">
          <UIcon name="i-lucide-webhook" class="w-4 h-4 text-orange-500" />
          Configuração do Webhook
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Configure esta URL no painel do Asaas para receber atualizações automáticas de pagamentos.
        </p>

        <div class="flex items-center gap-2 mb-4">
          <code class="flex-1 bg-gray-100 dark:bg-gray-800 text-sm p-2 rounded font-mono break-all">
            {{ webhookUrl }}
          </code>
          <UButton variant="soft" icon="i-lucide-copy" size="sm" @click="copyWebhookUrl">
            Copiar
          </UButton>
        </div>

        <div class="text-sm text-gray-500 space-y-1">
          <p class="font-medium text-gray-700 dark:text-gray-300">Eventos a habilitar no Asaas:</p>
          <ul class="list-disc list-inside ml-2 space-y-0.5">
            <li>PAYMENT_RECEIVED</li>
            <li>PAYMENT_CONFIRMED</li>
            <li>PAYMENT_UPDATED</li>
            <li>PAYMENT_OVERDUE</li>
            <li>PAYMENT_REFUNDED</li>
          </ul>
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

const { data: status, refresh: refreshStatus, pending: isLoading } = await useFetch('/api/asaas/status', {
  server: false,
  default: () => null
})

const webhookUrl = computed(() => {
  if (import.meta.client) {
    return `${window.location.origin}/api/asaas/webhook`
  }
  return '/api/asaas/webhook'
})

const reload = () => {
  syncResult.value = null
  refreshStatus()
}

const copyWebhookUrl = () => {
  navigator.clipboard.writeText(webhookUrl.value)
  toast.add({ title: 'URL copiada!', color: 'success' })
}

const importarClientes = async () => {
  if (!confirm('Deseja importar os clientes do Asaas para o CRM?')) return

  isImporting.value = true
  syncResult.value = null

  try {
    const result = await $fetch('/api/asaas/import-clients', {
      method: 'POST',
      body: { mode: 'import' }
    })
    syncResult.value = result
    toast.add({ title: result.message || 'Importação concluída!', color: 'success' })
    refreshStatus()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao importar clientes', color: 'error' })
  } finally {
    isImporting.value = false
  }
}

const syncClientes = async () => {
  if (!confirm('Deseja sincronizar os clientes do CRM com o Asaas?')) return

  isSyncing.value = true
  syncResult.value = null

  try {
    const result = await $fetch('/api/asaas/sync-clients', { method: 'POST' })
    syncResult.value = result
    toast.add({ title: result.message || 'Sincronização concluída!', color: 'success' })
    refreshStatus()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao sincronizar', color: 'error' })
  } finally {
    isSyncing.value = false
  }
}
</script>