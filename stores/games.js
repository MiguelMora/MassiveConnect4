import { defineStore } from 'pinia'
import {
  collection,
  where,
  query,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { getDb } from '~/services/firestore'
import { useUserStore } from '~/stores/user'

export const useGamesStore = defineStore('games', {
  state: () => ({
    subscribed: null, // función para de-subscribirse a la colección
    games: {}, // { id: game }
    onlyRunning: true,
  }),
  getters: {
    uid: () => {
      const userStore = useUserStore()
      const uid = userStore.uid
      return uid
    },
    asArray() {
      // incluye el id en el documento, y devuelve el array
      return Object.keys(this.games).map((id) => ({ id, ...this.games[id] }))
    },
  },
  actions: {
    subscribe() {
      if (!this.subscribed) {
        const col = collection(getDb(), 'games')
        const q = this.onlyRunning
          ? query(col, where('running', '==', true))
          : col
        this.games = {}
        this.subscribed = onSnapshot(q, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const doc = change.doc
            const id = doc.id
            if (change.type === 'added' || change.type === 'modified') {
              this.games[id] = doc.data()
            }
            if (change.type === 'removed') {
              delete this.games[id]
            }
          })
        })
      }
    },
    setOnlyRunning(value) {
      if (this.onlyRunning !== value) {
        this.unsubscribe()
        this.onlyRunning = value
        this.subscribe()
      }
    },
    unsubscribe() {
      if (this.subscribed) {
        this.subscribed()
        this.subscribed = null
      }
    },
    async createGame(name) {
      const col = collection(getDb(), 'games')
      const ref = await addDoc(col, {
        name,
        created: serverTimestamp(),
        turn: 0,
        running: true,
        winners: [],
        turns: {
          0: {
            leader: this.uid,
            changes: {
              [this.uid]: 1,
            },
            votes: {},
            traitors: [],
            selected: null,
          },
        },
      })
      return ref.id
    },
  },
})
