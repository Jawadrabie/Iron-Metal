import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { authTexts } from "../locales/auth"
import { profileTexts } from "../locales/profile"
import { privacyPolicyTexts } from "../locales/privacyPolicy"
import { featuredSectorsTexts } from "../locales/featuredSectors"
import { calculatorTexts } from "../locales/calculator";
import { supportTexts } from "../locales/support"
import { commonTexts } from "../locales/common"
import {
  getStoredLanguage,
  setStoredLanguage,
  type AppLanguage,
} from "../hooks/useLanguage"

export type AppTexts = {
  auth: (typeof authTexts)["en"]
  profile: (typeof profileTexts)["en"]
  privacyPolicy: (typeof privacyPolicyTexts)["en"]
  featuredSectors: (typeof featuredSectorsTexts)["en"],
  calculator: (typeof calculatorTexts)["en"]
  support: (typeof supportTexts)["en"]
  common: (typeof commonTexts)["en"]
}

type I18nContextValue = {
  language: AppLanguage
  setLanguage: (lang: AppLanguage) => void
  toggleLanguage: () => void
  isRTL: boolean
  ready: boolean
  t: AppTexts
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("en")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const stored = await getStoredLanguage()
      if (!cancelled && stored) setLanguageState(stored)
      if (!cancelled) setReady(true)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang)
    void setStoredLanguage(lang)
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next = prev === "en" ? "ar" : "en"
      void setStoredLanguage(next)
      return next
    })
  }, [])

  const isRTL = language === "ar"

  const t = useMemo<AppTexts>(() => {
    return {
      auth: authTexts[language],
      profile: profileTexts[language],
      privacyPolicy: privacyPolicyTexts[language],
      featuredSectors: featuredSectorsTexts[language],
      calculator: calculatorTexts[language],
      support: supportTexts[language],
      common: commonTexts[language],
    }
  }, [language])

  const value = useMemo<I18nContextValue>(() => {
    return {
      language,
      setLanguage,
      toggleLanguage,
      isRTL,
      ready,
      t,
    }
  }, [isRTL, language, ready, setLanguage, t, toggleLanguage])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider")
  return ctx
}
