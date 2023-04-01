<template>
  <v-card class="mx-auto" max-width="300">
    <v-card-title>{{ title }}</v-card-title>
    <v-card-text>
      <v-list :selected="[uid]" max-height="100%">
        <v-list-item
          v-for="(item, i) in members"
          :key="i"
          :value="item"
          :color="color"
        >
          <template #prepend>
            <v-icon v-if="votes[item]" color="success">mdi-check</v-icon>
          </template>
          <template #append>
            <v-icon v-if="leader === item" color="yellow">mdi-crown</v-icon>
            <v-icon v-if="traitors.includes(item)" color="error"
              >mdi-exit-run</v-icon
            >
          </template>
          <v-list-item-title>{{ item }}</v-list-item-title>
        </v-list-item>
        <v-list-subheader></v-list-subheader>
        <v-list-item
          v-for="(item, i) in newPlayers"
          :key="i"
          :value="item"
          variant="plain"
        >
          <v-list-item-title>{{ item }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card-text>
    <v-card-actions v-if="canChangeTeam">
      <v-btn
        icon="mdi-plus"
        :disabled="!canAdd"
        @click="$emit('added', uid)"
      ></v-btn>
      <v-btn
        icon="mdi-minus"
        :disabled="!canRemove"
        @click="$emit('removed', uid)"
      ></v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
const props = defineProps({
  uid: {
    type: String,
    default: '',
  },
  members: {
    type: Array,
    default: () => [],
  },
  color: {
    type: String,
    default: 'blue-grey',
  },
  title: {
    type: String,
    default: '',
  },
  leader: {
    type: String,
    default: '',
  },
  votes: {
    type: Object,
    default: () => {},
  },
  canChangeTeam: {
    type: Boolean,
    default: false,
  },
  newPlayers: {
    type: Array,
    default: () => [],
  },
  traitors: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['added', 'removed'])

const added = computed(() => props.newPlayers.includes(props.uid))
const removed = computed(() => props.traitors.includes(props.uid))
const canAdd = computed(() => !added.value || removed.value)
const canRemove = computed(() => !removed.value || added.value)
</script>

<style scoped></style>
