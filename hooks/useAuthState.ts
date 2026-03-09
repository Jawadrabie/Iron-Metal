import { useEffect, useState, useRef } from "react"
import { type User, type Session } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase/client"
import { AppState } from "react-native"

function isInvalidRefreshTokenError(message?: string | null) {
  if (!message) return false
  return /invalid refresh token|refresh token not found|session not found/i.test(message)
}

async function getSessionSafely() {
  const { data, error } = await supabase.auth.getSession()

  if (error && isInvalidRefreshTokenError(error.message)) {
    await supabase.auth.signOut().catch(() => null)
    return null
  }

  return data?.session ?? null
}

// Singleton cache to avoid multiple listeners racing or inconsistent states
let globalUser: User | null = null
let globalSession: Session | null = null
const listeners = new Set<(user: User | null) => void>()

// Initialize the global listener once
supabase.auth.onAuthStateChange((_event, session) => {
  globalSession = session
  globalUser = session?.user ?? null
  listeners.forEach((listener) => listener(globalUser))
})

// Also fetch initial session immediately
getSessionSafely().then((session) => {
  globalSession = session
  globalUser = session?.user ?? null
  listeners.forEach((listener) => listener(globalUser))
})

export function useAuthState() {
  const [user, setUser] = useState<User | null>(globalUser)
  const [loading, setLoading] = useState(!globalSession && !globalUser)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true

    // Subscribe to the global listener
    const listener = (u: User | null) => {
      if (mounted.current) {
        setUser(u)
        setLoading(false)
      }
    }
    
    listeners.add(listener)
    
    // Check immediately in case it changed while mounting
    if (globalUser !== user) {
      setUser(globalUser)
      setLoading(false)
    }

    // Double check with supabase directly just in case (e.g. cold start)
    if (loading) {
      getSessionSafely().then((session) => {
        if (mounted.current) {
          const u = session?.user ?? null
          if (u?.id !== user?.id) {
             setUser(u)
          }
          setLoading(false)
        }
      })
    }

    return () => {
      mounted.current = false
      listeners.delete(listener)
    }
  }, [user, loading]) // dependencies for re-check

  // Listen for AppState changes to refresh session when coming back to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        getSessionSafely().then((session) => {
           if (session?.user?.id !== globalUser?.id) {
             globalUser = session?.user ?? null
             globalSession = session
             listeners.forEach((l) => l(globalUser))
           }
        })
      }
    })

    return () => {
      subscription.remove()
    }
  }, [])

  return { user, loading }
}
