<template>
  <v-table>
    <thead>
      <tr>
        <td v-for="ci in nCols" :key="ci" class="text-center same-width">
          <v-btn
            v-if="validVotes[ci - 1]"
            size="x-small"
            icon
            :color="colors[teamTurn]"
            @click="$emit('vote', ci - 1)"
          >
            <v-icon>mdi-poker-chip</v-icon>
          </v-btn>
          <v-icon v-else-if="myVote === ci - 1" :color="colors[teamTurn]"
            >mdi-map-marker-check-outline</v-icon
          >
          <template
            v-if="teamTurn === myTeam && myTeam > 0 && columnVotes[ci - 1] > 0"
          >
            <v-badge
              v-if="leaderVote === ci - 1"
              :content="columnVotes[ci - 1]"
              :color="colors[teamTurn]"
            >
              <v-icon>mdi-crown</v-icon>
            </v-badge>
            <v-badge
              v-else
              :color="colors[teamTurn]"
              :content="columnVotes[ci - 1]"
              inline
            ></v-badge>
          </template>
        </td>
      </tr>
    </thead>
    <tbody>
      <tr v-for="ri in nRows" :key="ri">
        <td
          v-for="ci in nCols"
          :key="ci"
          class="text-center same-width"
          :class="ci % 2 ? 'bg-grey-lighten-5' : 'bg-grey-lighten-4'"
        >
          <v-responsive :aspect-ratio="1" class="align-center">
            <v-icon
              v-if="board[ci - 1][nRows - ri] > 0"
              size="x-large"
              :color="colors[board[ci - 1][nRows - ri]]"
              >mdi-poker-chip</v-icon
            >
          </v-responsive>
        </td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td
          v-for="ci in nCols"
          :key="ci"
          class="bg-grey-darken-3 same-width"
        ></td>
      </tr>
    </tfoot>
  </v-table>
</template>

<script setup>
defineProps({
  nCols: { type: Number, default: 6 },
  nRows: { type: Number, default: 6 },
  validVotes: { type: Array, default: () => [] },
  myTeam: { type: Number, default: 6 }, // 1 o 2, 0 otro no juega
  teamTurn: { type: Number, default: 6 }, // 1 o 2, o no se juega
  colors: { type: Array, default: () => ['blue-grey', 'indigo', 'teal'] }, // each team color
  myVote: { type: Number, default: -1 },
  board: { type: Array, default: () => [[], [], [], [], [], []] }, // array of columns
  columnVotes: { type: Array, default: () => [] },
  leaderVote: { type: Number, default: -1 }, // column voted by leader
})

defineEmits(['vote'])
</script>

<style scoped>
.same-width {
  width: calc(100% / v-bind('nCols'));
}
</style>
