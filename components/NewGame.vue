<template>
  <v-form @submit.prevent @submit="$emit('added', name)">
    <v-text-field
      v-model="name"
      :rules="rules"
      label="Nombre del juego"
    ></v-text-field>
    <v-btn
      class="mr-3"
      rounded
      type="submit"
      color="indigo-darken-3"
      prepend-icon="mdi-check"
    ></v-btn>
    <v-btn
      rounded
      variant="outlined"
      prepend-icon="mdi-close"
      color="red"
      @click="$emit('cancel')"
    ></v-btn>
  </v-form>
</template>

<script setup>
const name = ref('')
const rules = [(value) => !!value || 'requerido']
defineEmits(['added', 'cancel'])
</script>

<style scoped></style>
