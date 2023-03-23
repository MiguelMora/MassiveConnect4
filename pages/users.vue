<template>
  <v-card>
    <v-card-title> 4 en raya </v-card-title>
    <v-col v-for="(c, i) in cols">
      <v-row v-for="d in c">
        <v-icon color="red"> </v-icon>
      </v-row>
      <v-row>
        <v-btn @click="store.move(i)">+</v-btn>
      </v-row>
    </v-col>
  </v-card>
</template>

<script>
import { useUserStore } from '@/stores/user'
export default {
  setup() {
    definePageMeta({
      middleware: 'autenticado', // poner en todas las páginas que requieran autenticación
    })
    const store = useUserStore()
    return { store }
  },
}
</script>

<style scoped></style>
