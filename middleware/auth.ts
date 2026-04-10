export default defineNuxtRouteMiddleware(async () => {
  const token = localStorage.getItem('auth_token')

  if (!token) {
    return navigateTo('/')
  }

  try {
    await $fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  } catch {
    localStorage.removeItem('auth_token')
    return navigateTo('/')
  }
})
