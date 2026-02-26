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
  isRefetching: boolean
  hasLoadedOnce: boolean
  error: string | null
  unreadCount: number
  isGuest: boolean
  refresh: (showSpinner?: boolean) => Promise<void>
  markAllAsRead: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
}

const PAGE_SIZE = 20

function normalizeNotificationsErrorMessage(
  rawMessage: string | null | undefined,
  language: "ar" | "en",
): string {
  const message = String(rawMessage || "").trim()
  const normalized = message.toLowerCase()

  const isNetworkIssue =
    normalized.includes("network request failed") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("network error") ||
    normalized.includes("request timeout") ||
    normalized.includes("timeout")

  if (isNetworkIssue) {
    return language === "ar"
      ? "لا يوجد اتصال بالإنترنت. يرجى التحقق من الشبكة ثم المحاولة مرة أخرى."
      : "No internet connection. Please check your network and try again."
  }

  if (message) return message

  return language === "ar" ? "تعذر تحميل الإشعارات" : "Failed to load notifications"
}

export function useNotifications(): UseNotificationsResult {
  const { language } = useLanguage("en")
  const { user, loading: authLoading } = useAuthState()
  const [items, setItems] = useState<NotificationRow[]>([])
  const itemsLengthRef = useRef(0)
  useEffect(() => {
    itemsLengthRef.current = items.length
  }, [items])
  const hasCompletedFirstLoadRef = useRef(false)
  const [loading, setLoading] = useState(true)
  const [isRefetching, setIsRefetching] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState as AppStateStatus)

  const load = useCallback(async (silent = false, showSpinner = false) => {
    if (authLoading) return

    try {
      setError(null)
      const isFirstCompletedLoad = !hasCompletedFirstLoadRef.current
      if (!silent && isFirstCompletedLoad) {
        setLoading(true)
      } else if (showSpinner) {
        setIsRefetching(true)
      }

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
        setError(
          normalizeNotificationsErrorMessage(
            listError.message,
            language === "ar" ? "ar" : "en",
          ),
        )
        setItems([])
        return
      }

      setItems((rows ?? []) as NotificationRow[])
    } catch (e: any) {
      console.warn("useNotifications", e)
      setError(normalizeNotificationsErrorMessage(e?.message, language === "ar" ? "ar" : "en"))
      setItems([])
    } finally {
      hasCompletedFirstLoadRef.current = true
      setLoading(false)
      setIsRefetching(false)
      setHasLoadedOnce(true)
    }
  }, [language, user, authLoading])

  useEffect(() => {
    load(false)
  }, [load])

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextStatus) => {
      const prevStatus = appStateRef.current
      appStateRef.current = nextStatus
      const wasBackground = prevStatus === "background" || prevStatus === "inactive"
      if (wasBackground && nextStatus === "active") {
        load(true)
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

  const refresh = useCallback(async (showSpinner = false) => {
    await load(true, showSpinner)
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
    isRefetching,
    hasLoadedOnce,
    error,
    unreadCount,
    isGuest,
    refresh,
    markAllAsRead,
    markAsRead,
  }
}
