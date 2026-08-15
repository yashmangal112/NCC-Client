import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "./firebase"

// Types
export interface EventData {
  id?: string
  title: string
  subtitle: string
  type: string
  date: string
  time: string
  venue: string
  location: string
  price: string
  totalTickets: number
  description: string
  status: "Draft" | "Active" | "Completed"
  organizerId: string  // Original creator (remains for backward compatibility)
  additionalOrganizers: string[]  // Array of organizer emails
  imageUrl?: string
  ticketsSold?: number
  createdAt?: any
  updatedAt?: any
}

// Create a new event
export async function createEvent(eventData: EventData, imageFile?: File): Promise<string> {
  try {
    let imageUrl = ""

    // Upload image if provided
    if (imageFile) {
      const formData = new FormData()
      formData.append("file", imageFile)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload image")
      }

      const result = await response.json()
      imageUrl = result.secure_url
    }

    // Add event to Firestore
    const eventRef = await addDoc(collection(db, "events"), {
      ...eventData,
      imageUrl,
      ticketsSold: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return eventRef.id
  } catch (error) {
    console.error("Error creating event:", error)
    throw error
  }
}

// Get all events
export async function getAllEvents(): Promise<EventData[]> {
  try {
    const eventsQuery = query(collection(db, "events"), orderBy("createdAt", "desc"))

    const snapshot = await getDocs(eventsQuery)
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as EventData,
    )
  } catch (error) {
    console.error("Error getting events:", error)
    throw error
  }
}

// Get events by organizer
export async function getOrganizerEvents(organizerId: string): Promise<EventData[]> {
  try {
    const eventsQuery = query(
      collection(db, "events"),
      where("organizerId", "==", organizerId),
      orderBy("createdAt", "desc"),
    )

    const snapshot = await getDocs(eventsQuery)
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as EventData,
    )
  } catch (error) {
    console.error("Error getting organizer events:", error)
    throw error
  }
}

// Get event by ID
export async function getEventById(eventId: string): Promise<EventData | null> {
  try {
    const eventRef = doc(db, "events", eventId)
    const eventSnap = await getDoc(eventRef)

    if (eventSnap.exists()) {
      return {
        id: eventSnap.id,
        ...eventSnap.data(),
      } as EventData
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting event:", error)
    throw error
  }
}

// Update event
export async function updateEvent(eventId: string, eventData: Partial<EventData>, imageFile?: File): Promise<void> {
  try {
    const eventRef = doc(db, "events", eventId)

    const updateData: Partial<EventData> = {
      ...eventData,
      updatedAt: serverTimestamp(),
    }

    // Upload new image if provided
    if (imageFile) {
      const formData = new FormData()
      formData.append("file", imageFile)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload image")
      }

      const result = await response.json()
      updateData.imageUrl = result.secure_url
    }

    await updateDoc(eventRef, updateData)
  } catch (error) {
    console.error("Error updating event:", error)
    throw error
  }
}

// Delete event
export async function deleteEvent(eventId: string): Promise<void> {
  try {
    const eventRef = doc(db, "events", eventId)
    await deleteDoc(eventRef)
  } catch (error) {
    console.error("Error deleting event:", error)
    throw error
  }
}

