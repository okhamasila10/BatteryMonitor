// Inisialisasi Firebase (Realtime Database) untuk dashboard.
// Config diambil dari project "batterysoh-ee68d".
import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyCnJGvGBZ5scBKpBsRRl9ydC1QMlZ_dwvk',
  authDomain: 'batterysoh-ee68d.firebaseapp.com',
  databaseURL:
    'https://batterysoh-ee68d-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'batterysoh-ee68d',
  storageBucket: 'batterysoh-ee68d.firebasestorage.app',
  messagingSenderId: '191746255223',
  appId: '1:191746255223:web:6ed3ebc7ce179c3192d972',
  measurementId: 'G-KMBLFK7C3S',
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
export default app
