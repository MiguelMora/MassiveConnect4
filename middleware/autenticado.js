import { useUserStore } from '@/stores/user'

export default defineNuxtRouteMiddleware((to) => {
  const userStore = useUserStore()
  const loginPage = '/login'
  if (!userStore.logged) {
    userStore.setAfterLogin(to.path)
    return navigateTo(loginPage)
  }
})
