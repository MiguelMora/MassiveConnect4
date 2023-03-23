<template>
  <v-card>
    <v-toolbar color="cyan-lighten-1">
      <v-btn variant="text" icon="mdi-plus"></v-btn>
      <v-toolbar-title>Games</v-toolbar-title>
    </v-toolbar>
    <v-list>
      <v-list-item
        v-for="(item, i) in store.asArray"
        :key="i"
        :value="item.name"
        active-color="primary"
      >
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script setup>
import { useGamesStore } from '@/stores/games'

definePageMeta({
  middleware: 'autenticado', // poner en todas las páginas que requieran autenticación
})

const store = useGamesStore()
onMounted(callback: () => store.su): void


</script>

<style scoped></style>
