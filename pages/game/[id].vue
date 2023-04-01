<template>
  <v-container>
    <v-row>
      <v-col :cols="3">
        <a-team
          :uid="store.uid"
          :members="store.teamMembers[1]"
          :color="store.colors[1]"
          :leader="store.leader"
          :votes="store.turnData.votes"
          :can-change-team="store.teamTurn !== 1 && canChange"
          :new-players="store.teamTurn === 1 ? [] : store.game.newPlayers"
          :traitors="store.turnData.traitors"
          @added="store.addPlayer"
          @removed="store.betray"
        ></a-team>
      </v-col>
      <v-col :cols="6">
        <a-board
          :n-cols="store.nCols"
          :n-rows="store.nRows"
          :valid-votes="validVotes"
          :my-team="store.myTeam"
          :team-turn="store.teamTurn"
          :colors="store.colors"
          :my-vote="store.myVote"
          :board="store.board"
          :column-votes="store.columnVotes"
          :leader-vote="leaderVote"
          @vote="store.vote"
        ></a-board>
      </v-col>
      <v-col :cols="3">
        <a-team
          :uid="store.uid"
          :members="store.teamMembers[2]"
          :color="store.colors[2]"
          :leader="store.leader"
          :votes="store.turnData.votes"
          :can-change-team="store.teamTurn !== 2 && canChange"
          :new-players="store.teamTurn === 2 ? [] : store.game.newPlayers"
          :traitors="store.turnData.traitors"
          @added="store.addPlayer"
          @removed="store.betray"
        ></a-team>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useGameStore } from '~/stores/game'

definePageMeta({
  middleware: 'autenticado', // poner en todas las páginas que requieran autenticación
})

const store = useGameStore()

const { votesLeft } = storeToRefs(store)

const route = useRoute()
const id = route.params.id
onMounted(() => {
  store.subscribe(id)
})

const validVotes = computed(() =>
  store.withSpace.map((x) => store.canVote && x > 0)
)
const leaderVote = computed(() => store.turnData.votes[store.leader])

const canChange = computed(
  () => store.game.running && !store.currentTeamMembers.includes(store.uid)
)

const canFinish = computed(
  () => store.isLeader && store.votesLeft === 0 && store.game.running
)

watch(
  canFinish,
  async (can) => {
    if (can) {
      await store.finishTurn()
    }
  },
  { immediate: true }
)
</script>

<style scoped></style>
