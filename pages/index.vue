<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4">
          <span class="text-white font-bold text-2xl">LC</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Loopin CRM</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Faça login para continuar</p>
      </div>

      <UCard class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <UForm :state="formState" :schema="schema" @submit="handleLogin" class="space-y-4">
          <UFormField label="Email" name="email">
            <UInput
              v-model="formState.email"
              type="email"
              placeholder="seu@email.com"
              icon="i-lucide-mail"
              size="lg"
            />
          </UFormField>

          <UFormField label="Senha" name="password">
            <UInput
              v-model="formState.password"
              type="password"
              placeholder="••••••••"
              icon="i-lucide-lock"
              size="lg"
            />
          </UFormField>

          <UButton
            type="submit"
            color="primary"
            size="lg"
            block
            :loading="isLoading"
          >
            Entrar
          </UButton>
        </UForm>

        <div v-if="error" class="mt-4">
          <UAlert color="error" variant="soft" :title="error" />
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'

definePageMeta({
  layout: false,
})

const router = useRouter()
const toast = useToast()

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

const formState = reactive({
  email: '',
  password: '',
})

const isLoading = ref(false)
const error = ref('')

const handleLogin = async () => {
  isLoading.value = true
  error.value = ''

  try {
    const { token } = await $fetch('/api/auth/login', {
      method: 'POST',
      body: formState,
    })

    localStorage.setItem('auth_token', token)
    router.push('/dashboard')
  } catch (e: any) {
    error.value = e.data?.message || 'Credenciais inválidas'
  } finally {
    isLoading.value = false
  }
}
</script>
