import { defineStore } from 'pinia'
import { collection, where, query, onSnapshot } from 'firebase/firestore'
import { getDb } from '~/services/firestore'

export const useGamesStore = defineStore('games', {
  state: () => ({
    subscribed: null, // función para de-subscribirse a la colección
    games: {}, // { id: game }
  }),
  getters: {
    asArray() { // incluye el id en el documento, y devuelve el array
      return Object.keys(this.games).map((id) => ({ id, ...this.games[id] }))
    },
  },
  actions: {
    subscribe() {
      if (!this.subscribed) {
        const col = collection(getDb(), 'games')
        const q = query(col, where('running', '==', true))
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
    unsubscribe() {
      if (this.subscribed) {
        this.subscribed()
        this.subscribed = null
      }
    },
  },
})
