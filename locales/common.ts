export type CommonLocale = {
  moreMenu: {
    themeLight: string
    themeDark: string
    info: string
    myAds: string
    settings: string
    account: string
    suggestions: string
    featured: string
    localLink: string
    support: string
  }
  errorState: {
    defaultMessage: string
    retry: string
  }
}

export const commonTexts: Record<"ar" | "en", CommonLocale> = {
  en: {
    moreMenu: {
      themeLight: "Theme: Light",
      themeDark: "Theme: Dark",
      info: "Info",
      myAds: "My Ads",
      settings: "Settings",
      account: "Account",
      suggestions: "Suggestion",
      featured: "Featured",
      localLink: "Website",
      support: "Support",
    },
    errorState: {
      defaultMessage: "Something went wrong. Please try again.",
      retry: "Retry",
    },
  },
  ar: {
    moreMenu: {
      themeLight: "المظهر: فاتح",
      themeDark: "المظهر: داكن",
      info: "معلومات",
      myAds: "إعلاناتي",
      settings: "الإعدادات",
      account: "الحساب",
      suggestions: "اقتراحاتك",
      featured: "المميز",
      localLink: "موقعنا",
      support: "الدعم",
    },
    errorState: {
      defaultMessage: "حدث خطأ ما. حاول مرة أخرى.",
      retry: "إعادة المحاولة",
    },
  },
}
