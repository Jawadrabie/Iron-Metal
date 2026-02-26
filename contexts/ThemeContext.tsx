



import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react"
import type { ReactNode } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Animated, Dimensions, Easing, Image, StyleSheet, View } from "react-native"
import { captureRef } from "react-native-view-shot"
import MaskedView from "@react-native-masked-view/masked-view"
import Svg, { Circle, Defs, Mask, Rect } from "react-native-svg"

const AnimatedCircle = Animated.createAnimatedComponent(Circle)
const { width: screenWidth, height: screenHeight } = Dimensions.get("screen")
const maxRadius = Math.sqrt(screenWidth * screenWidth + screenHeight * screenHeight)

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
  setMode: (mode: ThemeMode, x?: number, y?: number) => void
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
  const [snapshotUri, setSnapshotUri] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [transitionTo, setTransitionTo] = useState<ThemeMode | null>(null)
  const radiusAnim = useRef(new Animated.Value(0)).current
  const centerXAnim = useRef(new Animated.Value(0)).current
  const centerYAnim = useRef(new Animated.Value(0)).current
  const rootRef = useRef<View>(null)

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

  const setMode = useCallback(async (next: ThemeMode, x?: number, y?: number) => {
    if (mode === next) return

    const topLeftX = 0
    const topLeftY = 0
    const bottomRightX = Math.max(screenWidth - 1, 0)
    const bottomRightY = Math.max(screenHeight - 1, 0)
    const isDarkToLight = mode === "dark" && next === "light"

    if (!rootRef.current) {
      setModeState(next)
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined)
      return
    }

    try {
      const uri = await captureRef(rootRef.current, {
        format: "png",
        quality: 1,
      })

      setSnapshotUri(uri)
      setIsAnimating(true)
      setTransitionTo(next)
      radiusAnim.setValue(isDarkToLight ? 0 : maxRadius)
      centerXAnim.setValue(isDarkToLight ? topLeftX : bottomRightX)
      centerYAnim.setValue(isDarkToLight ? topLeftY : bottomRightY)

      setTimeout(() => {
        setModeState(next)
        AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined)
        const animationDuration = isDarkToLight ? 650 : 550
        const animationEasing = isDarkToLight ? Easing.inOut(Easing.quad) : Easing.bezier(0.25, 0.1, 0.25, 1)

        Animated.parallel([
          Animated.timing(radiusAnim, {
            toValue: isDarkToLight ? maxRadius : 0,
            duration: animationDuration,
            easing: animationEasing,
            useNativeDriver: false,
          }),
          Animated.timing(centerXAnim, {
            toValue: isDarkToLight ? bottomRightX : topLeftX,
            duration: animationDuration,
            easing: animationEasing,
            useNativeDriver: false,
          }),
          Animated.timing(centerYAnim, {
            toValue: isDarkToLight ? bottomRightY : topLeftY,
            duration: animationDuration,
            easing: animationEasing,
            useNativeDriver: false,
          }),
        ]).start(() => {
          setIsAnimating(false)
          setSnapshotUri(null)
          setTransitionTo(null)
        })
      }, 50)
    } catch {
      setModeState(next)
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined)
      setTransitionTo(null)
    }
  }, [centerXAnim, centerYAnim, mode, radiusAnim])

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

  return (
    <ThemeContext.Provider value={value}>
      <View style={{ flex: 1 }} ref={rootRef} collapsable={false}>
        {children}
        {isAnimating && snapshotUri && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]} pointerEvents="none">
            <MaskedView
              style={StyleSheet.absoluteFill}
              maskElement={
                <Svg width={screenWidth} height={screenHeight} viewBox={`0 0 ${screenWidth} ${screenHeight}`}>
                  <Defs>
                    {transitionTo === "dark" ? (
                      <Mask id="mask">
                        <Rect width={screenWidth} height={screenHeight} fill="black" />
                        <AnimatedCircle cx={centerXAnim} cy={centerYAnim} r={radiusAnim} fill="white" />
                      </Mask>
                    ) : (
                      <Mask id="mask">
                        <Rect width={screenWidth} height={screenHeight} fill="white" />
                        <AnimatedCircle cx={centerXAnim} cy={centerYAnim} r={radiusAnim} fill="black" />
                      </Mask>
                    )}
                  </Defs>
                  <Rect width={screenWidth} height={screenHeight} fill="white" mask="url(#mask)" />
                </Svg>
              }
            >
              <Image source={{ uri: snapshotUri }} style={StyleSheet.absoluteFill} fadeDuration={0} />
            </MaskedView>
          </View>
        )}
      </View>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider")
  return ctx.theme
}
