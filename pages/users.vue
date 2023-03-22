<template>
  <v-card>
    <v-card-title> Página para usuarios conectados... </v-card-title>
  </v-card>
</template>

<script>
export default {
  setup() {
    definePageMeta({
      middleware: 'autenticado', // poner en todas las páginas que requieran autenticación
    })
  },
}
</script>

<style scoped></style>
