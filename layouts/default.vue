<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <UDashboardGroup>
      <UDashboardSidebar class="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        <template #header>
          <div class="flex items-center gap-3 px-4 py-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <span class="text-white font-bold text-lg">LC</span>
            </div>
            <div>
              <h1 class="font-semibold text-gray-900 dark:text-white">Loopin CRM</h1>
              <p class="text-xs text-gray-500 dark:text-gray-400">Gestão Financeira</p>
            </div>
          </div>
        </template>

        <UNavigationMenu
          :items="navigationItems"
          orientation="vertical"
          class="px-2"
        />

        <template #footer>
          <div class="p-4 border-t border-gray-200 dark:border-gray-800">
            <UButton
              variant="ghost"
              color="error"
              icon="i-lucide-log-out"
              class="w-full justify-start"
              @click="logout"
            >
              Sair
            </UButton>
          </div>
        </template>
      </UDashboardSidebar>

      <UDashboardPanel class="bg-gray-50 dark:bg-gray-950">
        <UDashboardNavbar title="Dashboard" />

        <template #header>
          <slot name="header" />
        </template>

        <div class="p-6">
          <slot />
        </div>
      </UDashboardPanel>
    </UDashboardGroup>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()

const navigationItems = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: 'i-lucide-layout-dashboard',
  },
  {
    label: 'Clientes',
    to: '/clients',
    icon: 'i-lucide-users',
  },
  {
    label: 'Estabelecimentos',
    to: '/establishments',
    icon: 'i-lucide-building-2',
  },
  {
    label: 'Faturas',
    to: '/invoices',
    icon: 'i-lucide-file-text',
  },
  {
    label: 'Financeiro',
    to: '/financial',
    icon: 'i-lucide-wallet',
  },
]

const logout = async () => {
  await $fetch('/api/auth/logout', { method: 'POST' })
  router.push('/')
}
</script>
