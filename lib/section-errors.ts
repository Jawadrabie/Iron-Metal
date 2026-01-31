import { getCurrentUser } from "./auth"
import { supabase } from "./supabase/client"

export interface SectionErrorData {
  section_id: number
  section_name: string
  reported_value?: string
  correct_value: string
  error_description?: string
  variant_index?: number
  slider_values?: string
  calculation_params?: any
}

export async function reportSectionError(data: SectionErrorData) {
  try {
    const { user } = await getCurrentUser()

    const payload = {
      user_id: user?.id || null,
      ...data,
      status: "pending",
    }

    let { error } = await supabase.from("section_errors").insert(payload)

    if (error && data.calculation_params != null && /calculation_params/i.test(error.message || "")) {
      const { calculation_params: _ignored, ...withoutCalculationParams } = payload as any
      const retry = await supabase.from("section_errors").insert(withoutCalculationParams)
      error = retry.error
    }

    if (error) {
      console.error("[section_errors] insert failed:", error)
      return { success: false as const, error: error.message }
    }

    return { success: true as const }
  } catch (error: any) {
    console.error("[section_errors] exception:", error)
    return { success: false as const, error: error?.message || "Unknown error" }
  }
}
