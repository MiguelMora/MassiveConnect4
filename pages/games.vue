<template>
  <v-card>
    <v-row>
      <v-toolbar color="cyan-lighten-1">
        <v-btn icon="mdi-plus" @click="creating = !creating"></v-btn>
        <v-toolbar-title>Games</v-toolbar-title>
      </v-toolbar>
    </v-row>
    <v-row v-if="creating">
      <v-col>
        <new-game @cancel="cancel" @added="added"></new-game>
      </v-col>
    </v-row>

    <v-list>
      <v-list-item
        v-for="(item, i) in store.asArray"
        :key="i"
        :value="item.id"
        :title="item.name"
        active-color="primary"
        :to="'/game/'+item.id"
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
onMounted(() => store.subscribe())
const creating = ref(false)

function cancel() {
  creating.value = false
}

function added(name) {
  creating.value = false
  store.createGame(name)
}
</script>

<style scoped></style>
