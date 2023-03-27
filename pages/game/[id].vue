<template>
  <v-table>
    <thead>
      <tr v-if="ourTurn">
        <td v-for="ci in nCols" class="text-center same-width">
          <v-btn v-if="canVote" icon @click="store.vote(ci)">
            <v-icon>mdi-vote</v-icon>
          </v-btn>
          <v-icon v-if="myVote === ci">mdi-map-marker-check-outline</v-icon>
        </td>
      </tr>
    </thead>
    <tbody>
      <tr v-for="ri in nRows">
        <td
          v-for="ci in nCols"
          class="text-center same-width"
          :class="ci % 2 ? 'bg-grey-lighten-5' : 'bg-grey-lighten-4'"
        >
          <v-icon v-if="board[(ci, ri)] > 0">mdi-poker-chip></v-icon>
        </td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td v-for="ci in nCols" class="bg-grey-darken-3 same-width"></td>
      </tr>
    </tfoot>
  </v-table>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useGameStore } from '~/stores/game'

definePageMeta({
  middleware: 'autenticado', // poner en todas las páginas que requieran autenticación
})

const store = useGameStore()

const { nCols, nRows, canVote, ourTurn, myVote, votesLeft, isLeader } =
  storeToRefs(store)
const { game, board } = store
const route = useRoute()
const id = route.params.id
onMounted(() => {
  store.subscribe(id)
})
</script>

<style scoped>
.same-width {
  width: calc(100% / v-bind('nCols'));
}
</style>
