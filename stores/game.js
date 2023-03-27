import { defineStore } from 'pinia'
import { onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore'

import { useUserStore } from '~/stores/user'
import { getDb } from '~/services/firestore'

export const useGameStore = defineStore('game', {
  state: () => ({
    nCols: 6,
    nRows: 6,
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
    // Nota: No se puede usar this en funciones lambda (=>)
    gameRef: (state) =>
      state.gameID ? doc(getDb(), 'games', state.gameID) : null,
    teams(state) {
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
    players() {
      return Object.keys(this.teams)
    },
    turnData: (state) => state.game.turns[state.game.turn],
    leader() {
      return this.turnData.leader
    },
    uid: () => useUserStore().uid,
    isLeader() {
      return this.leader === this.uid
    },
    inGame() {
      return (
        this.players.includes(this.uid) ||
        this.game.newPlayers.includes(this.uid)
      )
    },
    myTeam() {
      return this.players.includes(this.uid) ? this.teams[this.uid] : 0
    },
    teamTurn: (state) => (state.game.running ? (state.game.turn % 2) + 1 : 0),
    ourTurn() {
      return this.myTeam > 0 && this.teamTurn === this.myTeam
    },
    teamMembers() {
      return [
        this.players.filter((p) => this.teams[p] === -1), // sin equipo
        this.players.filter((p) => this.teams[p] === 1), // equipo 1
        this.players.filter((p) => this.teams[p] === 2), // equipo 2
      ]
    },
    currentTeamMembers(state) {
      return state.game.running ? this.teamMembers[this.teamTurn] : []
    },
    votesLeft() {
      return (
        this.currentTeamMembers.length - Object.keys(this.turnData.votes).length
      )
    },
    canVote() {
      return this.ourTurn && !this.turnData.votes[this.uid]
    },
    myVote() {
      return this.ourTurn ? this.turnData.votes[this.uid] : undefined
    },
    columnVotes(state) {
      const result = [].fill(0, 0, state.nCols)
      for (const v in this.turnData.votes) {
        result[this.turnData.votes[v]] += 1
      }
      return result
    },
    board(state) {
      const result = []
      for (let col = 0; col < state.nCols; ++col) result.push([])
      for (let t = 0; t <= state.game.turn; ++t) {
        const selected = state.game.turns[t].selected
        if (
          (selected || selected === 0) &&
          result[selected].length < state.nRows
        )
          result[selected].push((t % 2) + 1)
      }
      return result
    },
  },
  actions: {
    subscribe(id) {
      if (this.subscribed && id !== this.gameID) this.unsubscribe()
      if (!this.subscribed) {
        this.gameID = id
        this.subscribed = onSnapshot(this.gameRef, (doc) => {
          this.game = doc.data()
        })
      }
    },
    unsubscribe() {
      if (this.subscribed) {
        this.subscribed()
        this.subscribed = null
        this.gameID = null
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
