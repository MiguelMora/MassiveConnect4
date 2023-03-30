<template>
  <v-table>
    <thead>
      <tr v-if="ourTurn">
        <td v-for="ci in nCols" class="text-center same-width">
          <v-btn
            v-if="canVote && withSpace[ci - 1]"
            icon
            @click="store.vote(ci - 1)"
          >
            <v-icon>mdi-vote</v-icon>
          </v-btn>
          <v-icon v-if="myVote === ci - 1" :color="colors[teamTurn]"
            >mdi-map-marker-check-outline</v-icon
          >
        </td>
      </tr>
      <tr v-else-if="game.running">
        <td>el otro equipo</td>
      </tr>
      <tr v-else>
        <td>
          <v-icon v-if="game.winner === 0" size="x-large"
            >mdi-trophy-broken</v-icon
          >
          <v-icon v-else size="x-large">mdi-trophy</v-icon>
          <v-icon
            size="x-large"
            :color="colors[game.winner]"
            >mdi-poker-chip</v-icon
          >
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
          <v-icon
            v-if="store.board[ci - 1][nRows - ri] > 0"
            size="x-large"
            :color="colors[store.board[ci - 1][nRows - ri]]"
            >mdi-poker-chip</v-icon
          >
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

const {
  nCols,
  nRows,
  canVote,
  ourTurn,
  myVote,
  votesLeft,
  isLeader,
  withSpace,
  game,
  colors,
  teamTurn,
} = storeToRefs(store)

const route = useRoute()
const id = route.params.id
onMounted(() => {
  store.subscribe(id)
})

watch(
  votesLeft,
  async (votes) => {
    console.log(votes)
    if (isLeader.value && votes === 0 && game.value.running) {
      await store.finishTurn()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.same-width {
  width: calc(100% / v-bind('nCols'));
}
</style>
