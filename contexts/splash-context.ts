import { createContext, useContext } from "react"

export type SplashContextValue = {
  splashVisible: boolean
  splashDone: boolean
}

const DEFAULT_SPLASH_VALUE: SplashContextValue = {
  splashVisible: true,
  splashDone: false,
}

const SplashContext = createContext<SplashContextValue>(DEFAULT_SPLASH_VALUE)

export const SplashProvider = SplashContext.Provider

export function useSplash() {
  return useContext(SplashContext)
}
