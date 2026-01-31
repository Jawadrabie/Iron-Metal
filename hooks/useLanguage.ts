// Hook لإدارة اللغة

import { useCallback, useEffect, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

export type AppLanguage = "ar" | "en"

const STORAGE_KEY = "app_language"

type LanguageListener = (language: AppLanguage) => void

const languageListeners = new Set<LanguageListener>()

export function subscribeToLanguageChanges(listener: LanguageListener) {
  languageListeners.add(listener)
  return () => {
    languageListeners.delete(listener)
  }
}

function notifyLanguageChanged(language: AppLanguage) {
  for (const listener of languageListeners) {
    try {
      listener(language)
    } catch {
    }
  }
}

export async function getStoredLanguage(): Promise<AppLanguage | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY)
    if (value === "ar" || value === "en") return value
    return null
  } catch {
    return null
  }
}

export async function setStoredLanguage(language: AppLanguage): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, language)
  } catch {
  } finally {
    notifyLanguageChanged(language)
  }
}

export function useLanguage(defaultLanguage: AppLanguage = "en") {
  const [language, setLanguageState] = useState<AppLanguage>(defaultLanguage)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const unsubscribe = subscribeToLanguageChanges((next) => {
      if (cancelled) return
      setLanguageState(next)
    })

    const load = async () => {
      const stored = await getStoredLanguage()
      if (!cancelled && stored) setLanguageState(stored)
      if (!cancelled) setReady(true)
    }

    load()

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang)
    void setStoredLanguage(lang)
  }, [])

  return { language, setLanguage, ready }
}
