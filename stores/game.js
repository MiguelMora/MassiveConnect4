import { defineStore } from 'pinia'
import { onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore'

import { useUserStore } from '~/stores/user'
import { getDb } from '~/services/firestore'

export const useGameStore = defineStore('game', {
  state: () => ({
    nCols: 6,
    nRows: 6,
    colors: ['blue-grey', 'indigo', 'teal'],
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
      winners: [], // cuando el juego termine, tendrá los ganadores, vacío si empate
      winner: 0, // 0 empate o no ha terminado, 1 o 2 equipo ganador
      turns: {
        // objeto en lugar de array para controlar mejor los cambios
        // turnos, el ID es el número de turno, solo el leader puede crear el turno, e indicar la decisión
        0: {
          // datos iniciales del turno, lo escribe el leader anterior
          leader: null, // nuevo leader, al azar por ahora
          changes: {}, // pares idJugador:equipo en el que juega
          // -1 abandona y no puede volver, 0 observador, 1 y 2 equipos
          // datos que cada jugador indica durante el turno
          votes: {}, // voto de cada jugador al que le toca jugar [0..nCols)
          traitors: [], // se añaden los jugadores que quieren cambiar de equipo
          // lo escribe el líder al terminar el turno
          selected: null, // columna más votada [0..nCols), el líder desempata, y se cierra el turno
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
      const result = Array(state.nCols).fill(0)
      for (const v of Object.values(this.turnData.votes)) {
        result[v] += 1
      }
      return result
    },
    board(state) {
      // fichas en cada columna, desde la base
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
    withSpace(state) {
      return this.board.map((col) => col.length < state.nRows)
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
      if (this.canVote && this.withSpace[col]) {
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
    async finishTurn() {
      if (this.isLeader && this.game.running && this.votesLeft === 0) {
        const board = [...this.board] // first dim copy
        const maxVotes = Math.max(...this.columnVotes)
        const best = this.columnVotes.indexOf(maxVotes)
        const selected = this.columnVotes.includes(maxVotes, best + 1) // empate
          ? this.myVote // elección del leader, aunque no sea el más votado
          : best
        board[selected] = [...board[selected]] // selected column copy
        board[selected].push(this.teamTurn)
        // check if this team wins
        const wins = checkWins(
          board,
          selected,
          board[selected].length - 1,
          this.nCols,
          this.nRows,
          4
        )
        // check if termina en tablas
        const tie =
          Math.max(...board.map((col) => this.nRows - col.length)) === 0
        // check if the other team retires
        const newTeam = ((this.game.turn + 1) % 2) + 1
        const newTeamMembers = this.teamMembers[newTeam].filter(
          (uid) => !this.turnData.traitors.includes(uid) // sin los que cambian de equipo
        )
        if (wins || tie || newTeamMembers.length === 0) {
          console.log('game finished')
          await updateDoc(this.gameRef, {
            running: false,
            winner: tie ? 0 : this.teamTurn,
            winners: tie ? [] : this.teamMembers[this.teamTurn],
            [`turns.${this.game.turn}.selected`]: selected,
          })
        } else {
          console.log('new turn')
          const nTurnsTeam = Math.floor((this.game.turn + 1) / 2) // base 0
          const newLeader = newTeamMembers[nTurnsTeam % newTeam.length]
          const teamChanges = {}
          for (const t of this.turnData.traitors)
            teamChanges[t] = this.game.teamTurn
          const patch = {
            turn: this.game.turn + 1,
            [`turns.${this.game.turn}.selected`]: selected,
            [`turns.${this.game.turn + 1}.leader`]: newLeader,
            [`turns.${this.game.turn + 1}.changes`]: teamChanges,
            [`turns.${this.game.turn + 1}.votes`]: {},
            [`turns.${this.game.turn + 1}.traitors`]: [],
            [`turns.${this.game.turn + 1}.selected`]: null,
          }
          console.log(patch)
          await updateDoc(this.gameRef, patch)
        }
      }
    },
  },
})

// auxiliary functions
function countMax(arr, v) {
  // counts max consecutive v values in array arr
  let result = 0
  let current = 0
  for (let pos = 0; pos < arr.length; ++pos) {
    if (arr[pos] === v) ++current
    else {
      result = Math.max(result, current)
      current = 0
    }
  }
  return Math.max(current, result)
}

function checkWins(board, x, y, nCols, nRows, min2win) {
  // check if wins at position x y
  const val = board[x][y]
  const vertical = countMax(board[x], val)
  const horizontal = countMax(
    board.map((c) => c[y]),
    val
  )
  // diagonal 1
  const posD1 = Math.min(y, x)
  const lengthD1 = Math.min(nRows - 1 - y, nCols - 1 - x) + posD1 + 1
  const diag1 = countMax(
    Array(lengthD1)
      .fill(0)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map((e, i) => board[x + i - posD1][y + i - posD1]),
    val
  )
  // diagonal 2
  const posD2 = Math.min(nRows - 1 - y, x)
  const lengthD2 = Math.min(y, nCols - 1 - x) + posD2 + 1
  const diag2 = countMax(
    Array(lengthD2)
      .fill(0)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map((e, i) => board[x + i - posD2][y + posD2 - i]),
    val
  )
  return Math.max(vertical, horizontal, diag1, diag2) >= min2win
}
