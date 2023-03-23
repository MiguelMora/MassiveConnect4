import { defineStore } from 'pinia'
import { onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore'

import { useUserStore } from '~/stores/user'
import { getDb } from '~/services/firestore'
export const useGameStore = defineStore('game', {
  state: () => ({
    gameID: null,
    subscribed: null, // función para de-subscribirse
    game: {
      // juego actual, solo en uno a la vez
      // Esto solo lo puede cambiar el leader, que cambia el turno y fija el nuevo líder
      name: '',
      created: null, // fecha de creación
      turn: 0,
      // Nota: los jugadores de cada equipo es algo calculado
      running: false, // si el juego está activo
      turns: {
        // objeto en lugar de array para controlar mejor los cambios
        // turnos, el ID es el número de turno, solo el leader puede crear el turno, e indicar la decisión
        0: {
          // datos iniciales del turno, lo escribe el leader anterior
          leader: null, // nuevo leader, al azar por ahora
          changes: {}, // pares idJugador:equipo en el que juega
          // -1 abandona y no puede volver, 0 observador, 1 y 2 equipos
          // datos que cada jugador indica durante el turno
          votes: {}, // voto de cada jugador al que le toca jugar
          traitors: [], // se añaden los jugadores que quieren cambiar de equipo
          // lo escribe el líder al terminar el turno
          selected: null, // columna más votada, el líder desempata, y se cierra el turno
        },
      },
      newPlayers: [], // se añaden los jugadores que quieren entrar al juego
    },
  }),
  getters: {
    gameRef: (state) => {
      return doc(getDb(), 'games', state.gameID)
    },
    teams: (state) => {
      // pares jugador, equipo (-1 si abandonó)
      const result = {}
      for (let i = 0; i <= state.game.turn; ++i) {
        const turn = state.game.turns[i]
        for (const player of Object.keys(turn.changes)) {
          result[player] = turn.changes[player]
        }
      }
      return result
    },
    players: () => {
      return Object.keys(this.teams)
    },
    turnData: (state) => state.game.turns[state.game.turn],
    leader: () => this.turnData.leader,
    uid: () => {
      const userStore = useUserStore()
      const uid = userStore.uid
      return uid
    },
    isLeader: () => this.leader === this.uid,
    inGame: () =>
      this.players.includes(this.uid) ||
      this.game.newPlayers.includes(this.uid),
    myTeam: () => (this.players.includes(this.uid) ? this.teams[this.uid] : 0),
    teamTurn: (state) => (state.game.running ? (state.game.turn % 2) + 1 : 0),
    ourTurn: () => this.myTeam > 0 && this.teamTurn === this.myTeam,
    teamMembers: () => [
      this.players.filter((p) => this.teams[p] === -1), // sin equipo
      this.players.filter((p) => this.teams[p] === 1), // equipo 1
      this.players.filter((p) => this.teams[p] === 2), // equipo 2
    ],
    currentTeamMembers: (state) =>
      state.game.running ? this.teamMembers[this.teamTurn] : [],
    votesLeft: () =>
      this.currentTeamMembers.length - Object.keys(this.turnData.votes).length,
  },
  actions: {
    subscribe(id) {
      if (this.subscribed && id !== this.gameID) this.unsubscribe()
      if (!this.subscribed) {
        this.subscribed = onSnapshot(this.gameRef, (doc) => {
          this.game = doc.data()
        })
      }
    },
    unsubscribe() {
      if (this.subscribed) {
        this.subscribed()
        this.subscribed = null
      }
    },
    async addPlayer() {
      if (this.uid && !this.inGame) {
        await updateDoc(this.gameRef, {
          newPlayers: arrayUnion(this.uid),
        })
      }
    },
    async vote(col) {
      if (this.ourTurn && this.turnData.votes[this.uid] === undefined) {
        await updateDoc(this.gameRef, {
          [`turns.${this.game.turn}.votes.${this.uid}`]: col,
        })
      }
    },
    async betray() {
      if (!this.ourTurn) {
        await updateDoc(this.gameRef, {
          [`turns.${this.game.turn}.traitors`]: arrayUnion(this.uid),
        })
      }
    },
  },
})
