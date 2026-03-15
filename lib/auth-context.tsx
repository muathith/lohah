"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { User, onAuthStateChanged, signOut } from "firebase/auth"
import { auth, database } from "./firebase"
import { ref, set, remove, onValue, onDisconnect } from "firebase/database"
import { useRouter, usePathname } from "next/navigation"

const SESSION_KEY = "adminSessionId"
const SESSION_DB_PATH = "adminSession"

function getOrCreateSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

interface AuthContextType {
  user: User | null
  loading: boolean
  sessionBlocked: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  sessionBlocked: false,
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionBlocked, setSessionBlocked] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const sessionId = getOrCreateSessionId()
        const sessionRef = ref(database, SESSION_DB_PATH)

        // Read current active session from DB
        const snapshot = await new Promise<ReturnType<typeof onValue>>((resolve) => {
          onValue(sessionRef, resolve, { onlyOnce: true })
        }) as any

        const existing = snapshot.val()

        if (existing && existing.sessionId !== sessionId) {
          // Another session is already active — block this one
          await signOut(auth)
          sessionStorage.removeItem(SESSION_KEY)
          setSessionBlocked(true)
          setUser(null)
          setLoading(false)
          router.push("/login")
          return
        }

        // No other session or same session — claim/renew the session
        await set(sessionRef, {
          uid: firebaseUser.uid,
          sessionId,
          loginAt: Date.now(),
        })

        // Auto-remove session when browser disconnects
        onDisconnect(sessionRef).remove()

        setSessionBlocked(false)
        setUser(firebaseUser)
        setLoading(false)

        if (pathname === "/login") {
          router.push("/")
        }
      } else {
        setUser(null)
        setLoading(false)

        if (pathname !== "/login") {
          router.push("/login")
        }
      }
    })

    return () => unsubscribe()
  }, [router, pathname])

  const logout = async () => {
    try {
      const sessionRef = ref(database, SESSION_DB_PATH)
      await remove(sessionRef)
      sessionStorage.removeItem(SESSION_KEY)
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, sessionBlocked, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
