<template>
  <div class="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
    <!-- Desktop Sidebar -->
    <aside class="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col hidden md:flex">
      <!-- Header -->
      <div class="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-gray-800">
        <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
          <span class="text-white font-bold text-lg">LC</span>
        </div>
        <div>
          <h1 class="font-semibold text-gray-900 dark:text-white leading-tight">Loopin CRM</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">Gestão Financeira</p>
        </div>
      </div>
      
      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        <NuxtLink 
          v-for="item in navigationItems" 
          :key="item.to" 
          :to="item.to" 
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
          active-class="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
          :class="$route.path === item.to ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'"
        >
          <UIcon :name="item.icon" class="w-5 h-5 flex-shrink-0" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-800">
        <button 
          @click="logout"
          class="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
        >
          <UIcon name="i-lucide-log-out" class="w-5 h-5" />
          Sair do Sistema
        </button>
      </div>
    </aside>

    <!-- Mobile Navigation (Slideover) -->
    <USlideover v-model:open="isMobileMenuOpen" side="left">
      <template #content>
        <div class="flex-1 flex flex-col h-full bg-white dark:bg-gray-900">
          <div class="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                <span class="text-white font-bold text-lg">LC</span>
              </div>
              <div>
                <h1 class="font-semibold text-gray-900 dark:text-white leading-tight">Loopin CRM</h1>
              </div>
            </div>
            <UButton icon="i-lucide-x" variant="ghost" color="gray" @click="isMobileMenuOpen = false" />
          </div>
          
          <nav class="flex-1 overflow-y-auto px-4 py-6 space-y-1">
            <NuxtLink 
              v-for="item in navigationItems" 
              :key="item.to" 
              :to="item.to" 
              @click="isMobileMenuOpen = false"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              active-class="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
              :class="$route.path === item.to ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'"
            >
              <UIcon :name="item.icon" class="w-5 h-5 flex-shrink-0" />
              {{ item.label }}
            </NuxtLink>
          </nav>
          
          <div class="p-4 border-t border-gray-200 dark:border-gray-800">
            <button 
              @click="logout"
              class="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
            >
              <UIcon name="i-lucide-log-out" class="w-5 h-5" />
              Sair do Sistema
            </button>
          </div>
        </div>
      </template>
    </USlideover>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden relative">
      <!-- Mobile Header -->
      <header class="md:hidden h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-4 shrink-0">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span class="text-white font-bold text-sm">LC</span>
          </div>
          <span class="font-semibold text-gray-900 dark:text-white">Loopin</span>
        </div>
        <UButton variant="ghost" color="gray" icon="i-lucide-menu" @click="isMobileMenuOpen = true" />
      </header>
      
      <!-- Page Content -->
      <div class="flex-1 overflow-y-auto">
        <div class="p-6 lg:p-8 max-w-[1600px] mx-auto">
          <slot />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const router = useRouter()
const route = useRoute()
const isMobileMenuOpen = ref(false)

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
    label: 'Campanhas',
    to: '/campaigns',
    icon: 'i-lucide-monitor-play',
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
