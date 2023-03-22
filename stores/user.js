import { defineStore } from 'pinia'

import {
  initAuth,
  logIn,
  createUser,
  logOut,
  emailReset,
  emailVerification,
} from '~/services/fireinit'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    authInit: false,
    afterLogin: '/', // where to go after login completes
    error: '', // last auth error message
    errorCode: {
      'invalid-email': 'Invalid e-mail',
      'user-disabled': 'User account is disabled',
      'user-not-found': 'User not found, try to sign up instead',
      'wrong-password': 'Wrong password',
      'email-already-in-use': 'Email already in use, try to sign in instead',
    },
  }),
  getters: {
    uid: (state) => (state.user ? state.user.uid : ''),
    logged: (state) => state.user !== null,
    email: (state) => (state.user ? state.user.email : ''),
    name: (state) =>
      state.user
        ? state.user.displayName
          ? state.user.displayName
          : state.user.email
        : '',
  },
  actions: {
    setAfterLogin(url) {
      this.afterLogin = url
    },
    clearError() {
      this.error = ''
    },
    async signUserUp({ email, password }) {
      await this._doAction(createUser(email, password))
      return this.user
    },
    async signUserIn({ email, password }) {
      await this._doAction(logIn(email, password))
      return this.user
    },
    async resetPasswordWithEmail(email) {
      await this._doAction(emailReset(email))
    },
    async sendVerificationEmail() {
      await this._doAction(emailVerification())
    },
    async logout() {
      await this._doAction(logOut())
    },
    initAuth() {
      if (!this.authInit) {
        this.authInit = true
        initAuth((user) => {
          if (user)
            this.user = {
              displayName: user.displayName,
              email: user.email,
              uid: user.uid,
              emailVerified: user.emailVerified,
            }
          else this.user = null
        })
      }
      return this.authInit
    },
    async _doAction(promise) {
      // internal function to capture auth errors
      try {
        this.clearError()
        return await promise
      } catch (error) {
        const code = error.code.substring(5)
        this.error = this.errorCode[code] ? this.errorCode[code] : code
        return null
      }
    },
  },
})
