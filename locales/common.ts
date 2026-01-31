export type CommonLocale = {
  moreMenu: {
    themeLight: string
    themeDark: string
    install: string
    shortcuts: string
    settings: string
    account: string
    archive: string
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
      shortcuts: "Shortcuts",
      settings: "Settings",
      account: "Account",
      archive: "Archive",
      featured: "Featured",
      localLink: "localLink",
      support: "support",
    },
  },
  ar: {
    moreMenu: {
      themeLight: "المظهر: فاتح",
      themeDark: "المظهر: داكن",
      install: "تثبيت",
      shortcuts: "الاختصارات",
      settings: "الإعدادات",
      account: "الحساب",
      archive: "الأرشيف",
      featured: "المميز",
      localLink: "رابط محلي",
      support: "الدعم",
    },
  },
}
