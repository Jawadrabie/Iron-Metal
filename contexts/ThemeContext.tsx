



import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { ReactNode } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

export type ThemeMode = "light" | "dark"

export type ThemeColors = {
  background: string
  surface: string
  surface2: string
  text: string
  textSecondary: string
  neutral: string
  border: string
  primary: string
  secondary: string
  icon: string
  success: string
  warning: string
  error: string
}

export type AppTheme = {
  mode: ThemeMode
  isDark: boolean
  colors: ThemeColors
  setMode: (mode: ThemeMode) => void
}

const STORAGE_KEY = "@ironmetal:theme_mode_v1"

const LIGHT_COLORS: ThemeColors = {
  background: "#ffffff",
  surface: "#ffffff",
  surface2: "#f1f5f9",
  text: "#111827",
  textSecondary: "#6b7280",
  neutral: "#E5E5E5",
  border: "#e5e7eb",
  primary: "#302C6D",
  secondary: "#F08C21",
  icon: "#000000",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
}

const DARK_COLORS: ThemeColors = {
  background: "#1E1E1E",
  surface: "#242424",
  surface2: "#2C2C2C",
  text: "#FFFFFF",
  textSecondary: "#B3B3B3",
  neutral: "#E5E5E5",
  border: "#333333",
  primary: "#5B56D6",
  secondary: "#F08C21",
  icon: "#E5E5E5",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
}

type ThemeContextValue = {
  theme: AppTheme
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light")

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY)
        if (cancelled) return
        if (stored === "light" || stored === "dark") {
          setModeState(stored)
        } else if (stored === "system") {
          setModeState("light")
        }
      } catch {
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined)
  }, [])

  const isDark = mode === "dark"

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const theme = useMemo<AppTheme>(() => {
    return {
      mode,
      isDark,
      colors,
      setMode,
    }
  }, [colors, isDark, mode, setMode])

  const value = useMemo<ThemeContextValue>(() => ({ theme }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider")
  return ctx.theme
}
