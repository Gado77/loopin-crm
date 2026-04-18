export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/') {
    return
  }

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
  } catch (error) {
    localStorage.removeItem('auth_token')
    return navigateTo('/')
  }
})
