<template>
  <v-card>
    <v-row>
      <v-col>
        <v-toolbar color="cyan-lighten-1" class="align-baseline">
          <v-col
            ><v-btn icon="mdi-plus" @click="creating = !creating"></v-btn
          ></v-col>
          <v-col><v-toolbar-title>Games</v-toolbar-title></v-col>
          <v-col><v-switch :model-value="onlyRunning" class="mt-4" label="Available" @update:model-value="store.setOnlyRunning"></v-switch></v-col>
        </v-toolbar>
      </v-col>
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
        :to="'/game/' + item.id"
      >
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useGamesStore } from '@/stores/games'

definePageMeta({
  middleware: 'autenticado', // poner en todas las páginas que requieran autenticación
})

const store = useGamesStore()
onMounted(() => store.subscribe())
onUnmounted(() => store.unsubscribe())
const creating = ref(false)
const { onlyRunning } = storeToRefs(store)
function cancel() {
  creating.value = false
}

function added(name) {
  creating.value = false
  store.createGame(name)
}
</script>

<style scoped></style>
