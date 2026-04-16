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
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Status Asaas</p>
            <p class="text-lg font-bold" :class="status?.asaas?.connected ? 'text-green-600' : 'text-red-600'">
              {{ status?.asaas?.connected ? 'Conectado' : 'Desconectado' }}
            </p>
            <p v-if="status?.asaas?.account" class="text-xs text-gray-400 mt-0.5">{{ status.asaas.account }}</p>
            <p v-else-if="status?.asaas?.error" class="text-xs text-red-400 mt-0.5">{{ status.asaas.error }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl flex items-center justify-center"
            :class="status?.asaas?.connected ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'">
            <UIcon :name="status?.asaas?.connected ? 'i-lucide-check-circle' : 'i-lucide-x-circle'" class="w-6 h-6"
              :class="status?.asaas?.connected ? 'text-green-600' : 'text-red-600'" />
          </div>
        </div>
      </UCard>

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

    <!-- IMPORTAR FATURAS DO ASAAS -->
    <UCard class="mb-6 border-2 border-purple-200 dark:border-purple-800">
      <div>
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <UIcon name="i-lucide-file-down" class="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 class="text-base font-semibold">Importar Faturas do Asaas</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Puxa todas as cobranças existentes no Asaas e cria as faturas no CRM automaticamente</p>
          </div>
        </div>

        <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mb-4 text-sm text-amber-700 dark:text-amber-300">
          <p class="font-medium mb-1">⚠️ Antes de importar:</p>
          <ul class="list-disc list-inside space-y-0.5 text-xs">
            <li>Os clientes precisam estar sincronizados com o Asaas (devem ter asaas_customer_id)</li>
            <li>Cobranças que já existem no CRM serão ignoradas automaticamente</li>
            <li>Use "Simular" primeiro para ver o que será importado sem criar nada</li>
          </ul>
        </div>

        <div class="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Filtrar por status</label>
            <USelect
              v-model="importStatusFilter"
              :items="importStatusOptions"
              class="w-48"
            />
          </div>
          <div class="flex gap-2">
            <UButton
              variant="soft"
              color="info"
              icon="i-lucide-eye"
              :loading="isImportingPayments && isDryRun"
              :disabled="!status?.asaas?.connected"
              @click="importarFaturas(true)"
            >
              Simular
            </UButton>
            <UButton
              color="primary"
              icon="i-lucide-file-down"
              :loading="isImportingPayments && !isDryRun"
              :disabled="!status?.asaas?.connected"
              @click="importarFaturas(false)"
            >
              Importar Faturas
            </UButton>
          </div>
        </div>

        <!-- Resultado importação de faturas -->
        <div v-if="importPaymentsResult" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <p class="font-medium text-sm">
              {{ importPaymentsResult.dryRun ? '🔍 Simulação' : '✅ Resultado' }}
            </p>
            <UButton variant="ghost" size="xs" icon="i-lucide-x" @click="importPaymentsResult = null" />
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <div class="text-center p-2 bg-gray-100 dark:bg-gray-800 rounded">
              <p class="text-lg font-bold">{{ importPaymentsResult.counts?.total ?? 0 }}</p>
              <p class="text-xs text-gray-500">Total no Asaas</p>
            </div>
            <div class="text-center p-2 bg-green-100 dark:bg-green-900/30 rounded">
              <p class="text-lg font-bold text-green-600">{{ importPaymentsResult.counts?.imported ?? 0 }}</p>
              <p class="text-xs text-gray-500">{{ importPaymentsResult.dryRun ? 'Seriam importadas' : 'Importadas' }}</p>
            </div>
            <div class="text-center p-2 bg-sky-100 dark:bg-sky-900/30 rounded">
              <p class="text-lg font-bold text-sky-600">{{ importPaymentsResult.counts?.skippedExists ?? 0 }}</p>
              <p class="text-xs text-gray-500">Já existiam no CRM</p>
            </div>
            <div class="text-center p-2 bg-orange-100 dark:bg-orange-900/30 rounded">
              <p class="text-lg font-bold text-orange-600">{{ importPaymentsResult.counts?.skippedNoClient ?? 0 }}</p>
              <p class="text-xs text-gray-500">Sem cliente no CRM</p>
            </div>
          </div>

          <div v-if="importPaymentsResult.counts?.errors > 0" class="p-2 bg-red-50 dark:bg-red-900/20 rounded mb-2">
            <p class="text-xs font-medium text-red-600 mb-1">Erros ({{ importPaymentsResult.counts.errors }}):</p>
            <p v-for="e in importPaymentsResult.details?.errors?.slice(0,5)" :key="e" class="text-xs text-red-500">{{ e }}</p>
          </div>

          <div v-if="importPaymentsResult.counts?.skippedNoClient > 0">
            <p class="text-xs font-medium text-orange-600 mb-1">
              ⚠️ {{ importPaymentsResult.counts.skippedNoClient }} cobranças ignoradas — cliente Asaas não vinculado no CRM.
              Sincronize os clientes primeiro.
            </p>
          </div>

          <div v-if="importPaymentsResult.details?.imported?.length" class="mt-2">
            <p class="text-xs font-medium text-gray-600 mb-1">{{ importPaymentsResult.dryRun ? '💡 Seriam importadas:' : '✅ Importadas:' }}</p>
            <div class="max-h-48 overflow-y-auto space-y-0.5 bg-gray-50 dark:bg-gray-800/50 rounded p-2">
              <p v-for="(item, idx) in importPaymentsResult.details.imported" :key="idx" class="text-xs text-gray-600 dark:text-gray-300 font-mono">
                {{ item }}
              </p>
            </div>
          </div>

          <!-- Detalhes extras do dry run -->
          <div v-if="importPaymentsResult.dryRun && importPaymentsResult.details?.dryRunDetails?.length" class="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p class="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">📋 Detalhes da simulação:</p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
              <div class="text-center p-2 bg-white dark:bg-gray-800 rounded">
                <p class="text-sm font-bold text-blue-600">{{ getDryRunTotal(importPaymentsResult.details.dryRunDetails) }}</p>
                <p class="text-xs text-gray-500">Total (R$)</p>
              </div>
              <div class="text-center p-2 bg-white dark:bg-gray-800 rounded">
                <p class="text-sm font-bold text-purple-600">{{ importPaymentsResult.details.dryRunDetails.filter((d: any) => d.billingType === 'PIX').length }}</p>
                <p class="text-xs text-gray-500">PIX</p>
              </div>
              <div class="text-center p-2 bg-white dark:bg-gray-800 rounded">
                <p class="text-sm font-bold text-orange-600">{{ importPaymentsResult.details.dryRunDetails.filter((d: any) => d.billingType === 'BOLETO').length }}</p>
                <p class="text-xs text-gray-500">Boleto</p>
              </div>
              <div class="text-center p-2 bg-white dark:bg-gray-800 rounded">
                <p class="text-sm font-bold text-green-600">{{ importPaymentsResult.details.dryRunDetails.filter((d: any) => d.crmStatus === 'paid').length }}</p>
                <p class="text-xs text-gray-500">Já pagas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Ações de Clientes -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <UCard>
        <div>
          <h3 class="text-base font-semibold mb-1 flex items-center gap-2">
            <UIcon name="i-lucide-download" class="w-4 h-4 text-blue-600" />
            Importar Clientes do Asaas
          </h3>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-4">
            Traz clientes que estão no Asaas para o CRM. Se já existir pelo email, vincula automaticamente.
          </p>
          <UButton color="primary" icon="i-lucide-download" :loading="isImporting"
            :disabled="!status?.asaas?.connected" @click="importarClientes">
            Importar Clientes
          </UButton>
        </div>
      </UCard>

      <UCard>
        <div>
          <h3 class="text-base font-semibold mb-1 flex items-center gap-2">
            <UIcon name="i-lucide-upload" class="w-4 h-4 text-green-600" />
            Sincronizar Clientes → Asaas
          </h3>
          <p class="text-gray-500 dark:text-gray-400 text-sm mb-4">
            Envia clientes do CRM sem vínculo para o Asaas, criando-os lá automaticamente.
          </p>
          <UButton color="success" icon="i-lucide-upload" :loading="isSyncing"
            :disabled="!status?.asaas?.connected || (status?.clients?.withoutAsaas === 0)" @click="syncClientes">
            Sincronizar {{ status?.clients?.withoutAsaas || 0 }} cliente(s)
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Resultado de operações de cliente -->
    <UCard v-if="syncResult" class="mb-6">
      <div>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold">Resultado</h3>
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
        <div v-if="syncResult.details?.errorClients?.length">
          <p class="text-xs font-medium text-red-600 mb-1">Erros:</p>
          <p v-for="err in syncResult.details.errorClients" :key="err" class="text-xs text-red-500">{{ err }}</p>
        </div>
      </div>
    </UCard>

    <!-- Webhook -->
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
          <UButton variant="soft" icon="i-lucide-copy" size="sm" @click="copyWebhookUrl">Copiar</UButton>
        </div>
        <div class="text-sm text-gray-500 space-y-1">
          <p class="font-medium text-gray-700 dark:text-gray-300">Eventos a habilitar no Asaas:</p>
          <ul class="list-disc list-inside ml-2 text-xs space-y-0.5">
            <li>PAYMENT_RECEIVED / PAYMENT_CONFIRMED</li>
            <li>PAYMENT_UPDATED / PAYMENT_OVERDUE</li>
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
const isImportingPayments = ref(false)
const isDryRun = ref(false)
const syncResult = ref<any>(null)
const importPaymentsResult = ref<any>(null)
const importStatusFilter = ref('all')

const importStatusOptions = [
  { label: 'Todos os status', value: 'all' },
  { label: 'Pendentes', value: 'PENDING' },
  { label: 'Confirmados / Pagos', value: 'CONFIRMED' },
  { label: 'Atrasados', value: 'OVERDUE' },
  { label: 'Recebidos', value: 'RECEIVED' },
]

const { data: status, refresh: refreshStatus, pending: isLoading } = await useFetch('/api/asaas/status', {
  server: false,
  default: () => null
})

const webhookUrl = computed(() => {
  if (import.meta.client) return `${window.location.origin}/api/asaas/webhook`
  return '/api/asaas/webhook'
})

const reload = () => {
  syncResult.value = null
  importPaymentsResult.value = null
  refreshStatus()
}

const copyWebhookUrl = () => {
  navigator.clipboard.writeText(webhookUrl.value)
  toast.add({ title: 'URL copiada!', color: 'success' })
}

const getDryRunTotal = (details: any[]) => {
  if (!details?.length) return 0
  return details.reduce((sum: number, d: any) => sum + (d.value || 0), 0).toFixed(2).replace('.', ',')
}

const importarFaturas = async (dryRun: boolean) => {
  if (!dryRun && !confirm('Confirma a importação de TODAS as cobranças do Asaas como faturas no CRM?')) return

  isImportingPayments.value = true
  isDryRun.value = dryRun
  importPaymentsResult.value = null

  try {
    const result = await $fetch('/api/asaas/import-payments', {
      method: 'POST',
      body: {
        dryRun,
        status: importStatusFilter.value === 'all' ? null : importStatusFilter.value
      }
    })
    importPaymentsResult.value = result
    toast.add({
      title: result.message,
      color: dryRun ? 'info' : 'success'
    })
    if (!dryRun) refreshStatus()
  } catch (e: any) {
    toast.add({ title: e.data?.message || 'Erro ao importar faturas', color: 'error' })
  } finally {
    isImportingPayments.value = false
  }
}

const importarClientes = async () => {
  if (!confirm('Deseja importar os clientes do Asaas para o CRM?')) return
  isImporting.value = true
  syncResult.value = null
  try {
    const result = await $fetch('/api/asaas/import-clients', { method: 'POST', body: { mode: 'import' } })
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