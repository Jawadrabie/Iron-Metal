import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AppState, AppStateStatus } from "react-native"

import { supabase } from "../lib/supabase/client"
import { useAuthState } from "./useAuthState"
import { useLanguage } from "./useLanguage"

export type NotificationRow = {
  id: string
  user_id: string
  title: string
  body: string | null
  kind: string | null
  url: string | null
  read_at: string | null
  created_at: string
}

type UseNotificationsResult = {
  items: NotificationRow[]
  loading: boolean
  error: string | null
  unreadCount: number
  isGuest: boolean
  refresh: () => Promise<void>
  markAllAsRead: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
}

const PAGE_SIZE = 20

export function useNotifications(): UseNotificationsResult {
  const { language } = useLanguage("en")
  const { user, loading: authLoading } = useAuthState()
  const [items, setItems] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState as AppStateStatus)

  const load = useCallback(async () => {
    if (authLoading) return

    try {
      setError(null)
      setLoading(true)

      if (!user) {
        setUserId(null)
        setItems([])
        return
      }

      setUserId(user.id)

      const from = 0
      const to = PAGE_SIZE - 1

      const { data: rows, error: listError } = await supabase
        .from("user_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(from, to)

      if (listError) {
        console.warn("useNotifications list", listError)
        setError(listError.message)
        setItems([])
        return
      }

      setItems((rows ?? []) as NotificationRow[])
    } catch (e: any) {
      console.warn("useNotifications", e)
      setError(
        e?.message ?? (language === "ar" ? "تعذر تحميل الإشعارات" : "Failed to load notifications"),
      )
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [language, user, authLoading])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextStatus) => {
      const prevStatus = appStateRef.current
      appStateRef.current = nextStatus
      const wasBackground = prevStatus === "background" || prevStatus === "inactive"
      if (wasBackground && nextStatus === "active") {
        load()
      }
    })
    return () => {
      subscription.remove()
    }
  }, [load])

  useEffect(() => {
    if (!userId) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      return
    }

    if (channelRef.current) {
      return
    }

    const channel = supabase
      .channel(`user_notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newRow = payload.new as NotificationRow
          setItems((prev) => {
            if (prev.some((n) => n.id === newRow.id)) {
              return prev
            }
            return [newRow, ...prev].slice(0, PAGE_SIZE)
          })
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as NotificationRow
          setItems((prev) =>
            prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)),
          )
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId])

  const refresh = useCallback(async () => {
    await load()
  }, [load])

  const markAllAsRead = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getUser()
      const user = data?.user
      if (!user) return

      const { error } = await supabase
        .from("user_notifications")
        .update({ read_at: new Date().toISOString() })
        .is("read_at", null)
        .eq("user_id", user.id)

      if (error) {
        console.warn("useNotifications markAllAsRead", error)
        return
      }

      const now = new Date().toISOString()
      setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })))
    } catch (e) {
      console.warn("useNotifications markAllAsRead", e)
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    try {
      const now = new Date().toISOString()

      const { error } = await supabase
        .from("user_notifications")
        .update({ read_at: now })
        .eq("id", id)

      if (error) {
        console.warn("useNotifications markAsRead", error)
        return
      }

      setItems((prev) =>
        prev.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: now } : n)),
      )
    } catch (e) {
      console.warn("useNotifications markAsRead", e)
    }
  }, [])

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read_at).length,
    [items],
  )

  const isGuest = useMemo(() => userId === null && !error, [userId, error])

  return {
    items,
    loading,
    error,
    unreadCount,
    isGuest,
    refresh,
    markAllAsRead,
    markAsRead,
  }
}
