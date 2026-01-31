import { supabase } from "./supabase/client"
import { getCurrentUser } from "./auth"

const STRINGS = {
  en: {
    mustLoginSave: "You must sign in to save featured sectors.",
    saveFailed: "Failed to save featured sector. Please try again.",
    mustLoginList: "You must sign in to view featured sectors.",
    listFailed: "An error occurred while loading featured sectors.",
    mustLoginDelete: "You must sign in to delete featured sectors.",
    deleteFailed: "Failed to delete featured sector. Please try again.",
  },
  ar: {
    mustLoginSave: "يجب تسجيل الدخول لحفظ القطاعات المميزة.",
    saveFailed: "تعذر حفظ القطاع المميز. حاول مرة أخرى.",
    mustLoginList: "يجب تسجيل الدخول لعرض القطاعات المميزة.",
    listFailed: "حدث خطأ أثناء تحميل القطاعات المميزة.",
    mustLoginDelete: "يجب تسجيل الدخول لحذف القطاعات المميزة.",
    deleteFailed: "تعذر حذف القطاع المميز. حاول مرة أخرى.",
  },
} as const

export type FeaturedSectorInsert = {
  section_id: number
  section_type?: string
  variant_index?: number
  slider_value?: string
  price_per_kg?: number
  required_pieces?: number
  length_value?: number
  length_unit?: string
  height?: number
  width?: number
  thickness?: number
  hook_length?: number
  dimension_unit?: string
  density?: number
  unit_weight?: number
  total_weight?: number
  unit_price?: number
  total_cost?: number
  calc_type?: string
}

export type FeaturedSectorRow = FeaturedSectorInsert & {
  id: string
  user_id: string
  created_at: string
}

export async function saveFeaturedSectorMobile(data: FeaturedSectorInsert, lang: "ar" | "en" = "en") {
  const t = STRINGS[lang]
  const { user } = await getCurrentUser()

  if (!user) {
    return { success: false, error: t.mustLoginSave }
  }

  const payload = {
    user_id: user.id,
    ...data,
  }

  const { error } = await supabase.from("featured_sectors").insert(payload)

  if (error) {
    return { success: false, error: t.saveFailed }
  }

  return { success: true as const }
}

export async function getFeaturedSectorsMobile(lang: "ar" | "en" = "en") {
  const t = STRINGS[lang]
  const { user } = await getCurrentUser()

  if (!user) {
    return { items: [] as FeaturedSectorRow[], error: t.mustLoginList }
  }

  const { data, error } = await supabase
    .from("featured_sectors")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return { items: [] as FeaturedSectorRow[], error: t.listFailed }
  }

  return { items: (data ?? []) as FeaturedSectorRow[], error: undefined }
}

export async function deleteFeaturedSectorMobile(id: string, lang: "ar" | "en" = "en") {
  const t = STRINGS[lang]
  const { user } = await getCurrentUser()

  if (!user) {
    return { success: false, error: t.mustLoginDelete }
  }

  const { error } = await supabase
    .from("featured_sectors")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    return { success: false, error: t.deleteFailed }
  }

  return { success: true as const }
}
