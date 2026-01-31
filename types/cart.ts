export type SectionCartItem = {
  id: string
  title?: string
  subtitle?: string
  img?: string | null
  bigImg?: string | null
  info?: string | null
  country?: string | null
  data: Record<string, unknown>
  // تعريفات إضافية لمساعدة روابط PDF على فتح نفس القطاع في الموقع
  sectionId?: number
  sectionType?: string
  variantIndex?: number
  sliderValue?: number
}
