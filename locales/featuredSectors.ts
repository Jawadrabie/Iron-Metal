export type FeaturedSectorsLocale = {
  title: string
  guestTitle: string
  guestSubtitle: string
  empty: string
}

export const featuredSectorsTexts: Record<"ar" | "en", FeaturedSectorsLocale> = {
  en: {
    title: "Featured Sectors",
    guestTitle: "No featured sectors yet",
    guestSubtitle: "Please log in to view and save your featured sectors.",
    empty:
      "You haven't saved any sectors yet. Use the star button in the calculator to save.",
  },
  ar: {
    title: "القطاعات المميزة",
    guestTitle: "لا توجد قطاعات مميزة بعد",
    guestSubtitle: "سجّل الدخول لعرض القطاعات المميزة وحفظها.",
    empty:
      "لم تحفظ أي قطاعات بعد. استخدم زر النجمة في الحاسبة لحفظ القطاعات.",
  },
}
