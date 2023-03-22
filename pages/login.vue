<template>
  <a-login
    :error="userStore.error"
    @sign-in="userStore.signUserIn"
    @sign-up="userStore.signUserUp"
  ></a-login>
</template>

<script>
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

export default {
  setup() {
    const userStore = useUserStore()
    const { logged } = storeToRefs(userStore)
    const router = useRouter()
    watch(
      logged,
      (logged) => {
        if (logged) {
          router.push(userStore.afterLogin)
        }
      },
      { immediate: true }
    )
    return { userStore }
  },
  mounted() {
    this.userStore.initAuth()
  },
}
</script>

<style scoped></style>
