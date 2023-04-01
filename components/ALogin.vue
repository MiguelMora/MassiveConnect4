<template>
  <v-form v-model="valid">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-alert v-if="!!error" :dismissible="true" type="error">{{
            error
          }}</v-alert>
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="email"
            :rules="[rules.email]"
            label="E-mail"
            required
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="password"
            :append-icon="show ? 'mdi-eye' : 'mdi-eye-off'"
            :rules="[rules.required, rules.min]"
            :type="show ? 'text' : 'password'"
            name="current-password"
            label="Password"
            @click:append="show = !show"
          ></v-text-field>
        </v-col>
        <v-col>
          <v-btn :disabled="!valid" @click="onSignIn">Sign in</v-btn>
        </v-col>
        <v-col>
          <v-btn :disabled="!valid" @click="onSignUp">Sign Up</v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>

<script setup>
defineProps({
  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['signIn', 'signUp'])

const valid = ref(false)
const show = ref(false)
const email = ref('')
const password = ref('')

const rules = computed(() => {
  return {
    required: (value) => !!value || 'Required',
    min: (v) => v.length >= 8 || 'Min 8 characters',
    email: (v) =>
      !v ||
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,20})+$/.test(v) ||
      'Invalid Email',
  }
})

function onSignIn() {
  emit('signIn', {
    email: email.value,
    password: password.value,
  })
}
function onSignUp() {
  emit('signUp', {
    email: email.value,
    password: password.value,
  })
}
</script>

<style scoped></style>
