import { db } from "./firebase"
import { collection, doc, getDoc, setDoc } from "firebase/firestore"
import { auth } from "./firebase"

export async function initializeDatabase() {
  try {
    // Wait for authentication to be ready
    if (!auth.currentUser) {
      console.log("Waiting for authentication...")
      return
    }

    // Create initial collections with a dummy document
    const collections = ["users", "organizers", "events", "tickets"]

    for (const collectionName of collections) {
      const dummyDocRef = doc(collection(db, collectionName), "_init")
      
      // Check if _init document already exists
      const dummyDoc = await getDoc(dummyDocRef)
      if (!dummyDoc.exists()) {
        await setDoc(
          dummyDocRef,
          {
            _init: true,
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        )
        console.log(`Initialized collection: ${collectionName}`)
      }
    }

    console.log("Database collections initialized successfully")
  } catch (error) {
    console.error("Error initializing database collections:", error)
  }
}