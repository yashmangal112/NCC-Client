import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { 
  getFirestore, 
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment 
} from "firebase/firestore"
import { 
  getStorage, 
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage"
import { initializeDatabase } from "./db-init"

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)
const googleProvider = new GoogleAuthProvider()

// Initialize collections
if (typeof window !== "undefined") {
  // Only run on client side
  initializeDatabase()
}

// Collection references
const usersCollection = collection(db, "users")
const organizersCollection = collection(db, "organizers")
const eventsCollection = collection(db, "events")
const ticketsCollection = collection(db, "tickets")
const hackathonParticipantsCollection = collection(db, "hackathonParticipants")
const foodCouponsCollection = collection(db, "foodCoupons")

export { 
  app, 
  auth, 
  db, 
  storage, 
  googleProvider,
  usersCollection,
  organizersCollection,
  eventsCollection,
  ticketsCollection,
  hackathonParticipantsCollection,
  foodCouponsCollection,
  // Also export Firestore functions for easier imports
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  // Storage functions
  ref,
  uploadBytes,
  getDownloadURL
}