import { useCallback, useEffect, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

import type { SectionCartItem } from "../types/cart"

const STORAGE_KEY = "sections-cart-v1"

export function useSectionsCart() {
  const [items, setItems] = useState<SectionCartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY)
        if (raw) {
          setItems(JSON.parse(raw))
        }
      } catch (e) {
        console.warn("[sections-cart] Failed to load cart", e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (loading) return
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch((e) => {
      console.warn("[sections-cart] Failed to persist cart", e)
    })
  }, [items, loading])

  const addItem = useCallback((item: SectionCartItem) => {
    setItems((prev) => {
      if (prev.some((it) => it.id === item.id)) return prev
      return [...prev, item]
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }, [])

  const clear = useCallback(() => {
    setItems([])
  }, [])

  return { items, loading, addItem, removeItem, clear }
}
