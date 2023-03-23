import { getFirestore } from 'firebase/firestore'
import { initApp } from './fireinit'

let db
export function getDb() {
  if (!db) {
    const app = initApp()
    db = getFirestore(app)
  }
  return db
}
