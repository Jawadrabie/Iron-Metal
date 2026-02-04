export type CommonLocale = {
  moreMenu: {
    themeLight: string
    themeDark: string
    install: string
    myAds: string
    settings: string
    account: string
    suggestions: string
    featured: string
    localLink: string
    support: string
  }
}

export const commonTexts: Record<"ar" | "en", CommonLocale> = {
  en: {
    moreMenu: {
      themeLight: "Theme: Light",
      themeDark: "Theme: Dark",
      install: "Install",
      myAds: "My Ads",
      settings: "Settings",
      account: "Account",
      suggestions: "Suggestion",
      featured: "Featured",
      localLink: "Website",
      support: "Support",
    },
  },
  ar: {
    moreMenu: {
      themeLight: "المظهر: فاتح",
      themeDark: "المظهر: داكن",
      install: "تثبيت",
      myAds: "إعلاناتي",
      settings: "الإعدادات",
      account: "الحساب",
      suggestions: "اقتراحاتك",
      featured: "المميز",
      localLink: "موقعنا",
      support: "الدعم",
    },
  },
}
